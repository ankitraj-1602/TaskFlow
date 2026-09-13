import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Button } from '../components/Forms/Button';
import { KanbanColumn } from '../components/Kanban/KanbanColumn';
import { TaskModal } from '../components/Task/TaskModal';
import { TaskDetailModal } from '../components/Task/TaskDetailModal';
import { useTaskStore } from '../store/task.store';
import { useWorkspaceStore } from '../store/workspace.store';
import { usePermission } from '../hooks/usePermission';
import { KanbanDndProvider } from '../components/Kanban/KanbanDndContext';
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';

// Aligned with the blue/amber/emerald accent convention used on the
// Dashboard, WorkspaceDetail, and ProjectDetail stat cards.
const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'REVIEW', title: 'Review', color: 'bg-amber-500' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-500' },
];

export const KanbanBoard = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const {
    tasks,
    loadProjectTasks,
    updateTaskStatus,
    reorderTasks,
    isLoading,
  } = useTaskStore();
  const { workspaces, loadWorkspaces } = useWorkspaceStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInColumn, setCreateInColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── RBAC ─────────────────────────────────────────
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const workspaceRole = workspace
    ? workspace.owner_role === 'OWNER'
      ? 'OWNER'
      : workspace.member_role || workspace.userRole || 'VIEWER'
    : 'VIEWER';

  const { isMember } = usePermission(workspaceRole);
  // ──────────────────────────────────────────────────

  // Load data on mount
  useEffect(() => {
    loadWorkspaces().catch(() => {});
    loadProjectTasks(projectId, { limit: 500 });
  }, [projectId]);

  // Group tasks by status (with search filter)
  const getTasksForColumn = (status) => {
    return tasks.filter((task) => {
      if (task.status !== status) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        task.title?.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q)
      );
    });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleEditTask = () => {
    setShowDetail(false);
    setShowEditModal(true);
  };

  const handleAddInColumn = (status) => {
    setCreateInColumn(status);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateInColumn(null);
  };

  // Called by KanbanColumn when a task is dropped
  const handleTaskMove = async (taskId, newStatus, newPosition) => {
    try {
      await updateTaskStatus(taskId, newStatus, newPosition);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to move task');
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            onClick={() =>
              navigate(`/workspaces/${workspaceId}/projects/${projectId}`)
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Back to project"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Kanban Board</h2>
            <p className="text-gray-500 mt-1">
              Drag tasks between columns to update status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors w-64"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects/${projectId}/tasks`
                )
              }
            >
              <ListBulletIcon className="h-5 w-5 mr-2" />
              List View
            </Button>
            {isMember && (
              <Button onClick={() => handleAddInColumn('TODO')}>
                <PlusIcon className="h-5 w-5 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* Board */}
        {isLoading && tasks.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
  <KanbanDndProvider
    tasks={tasks}
    onTaskMove={handleTaskMove}
    onTaskClick={handleTaskClick}
  >
    {COLUMNS.map((column) => (
      <KanbanColumn
        key={column.id}
        column={column}
        tasks={getTasksForColumn(column.id)}
        onTaskClick={handleTaskClick}
        onAddTask={() => handleAddInColumn(column.id)}
        onTaskMove={handleTaskMove}
        canCreate={isMember}
        projectId={projectId}
      />
    ))}
  </KanbanDndProvider>
</div>
        )}

        {/* Modals */}
        <TaskModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          projectId={projectId}
          defaultStatus={createInColumn || 'TODO'}
        />

        <TaskModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          projectId={projectId}
        />

        <TaskDetailModal
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onEdit={isMember ? handleEditTask : undefined}
          workspaceRole={workspaceRole}
        />
      </div>
    </ProtectedLayout>
  );
};