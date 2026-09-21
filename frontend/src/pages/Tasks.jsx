import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Button } from '../components/Forms/Button';
import { StatusBadge } from '../components/UI/StatusBadge';
import { PriorityBadge } from '../components/UI/PriorityBadge';
import { EmptyState } from '../components/UI/EmptyState';
import { TaskModal } from '../components/Task/TaskModal';
import { TaskDetailModal } from '../components/Task/TaskDetailModal';
import { useTaskStore } from '../store/task.store';
import { useWorkspaceStore } from '../store/workspace.store';
import { usePermission } from '../hooks/usePermission';
import { taskApi } from '../api/task.api';
import { LabelFilter } from '../components/Label/LabelFilter';
import { LabelBadge } from '../components/Label/LabelBadge';

import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  FunnelIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export const Tasks = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { tasks, loadProjectTasks, isLoading, pagination } = useTaskStore();
  const { workspaces, loadWorkspaces } = useWorkspaceStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('position');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);

  // RBAC
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const workspaceRole = workspace
    ? workspace.owner_role === 'OWNER'
      ? 'OWNER'
      : workspace.member_role || workspace.userRole || 'VIEWER'
    : 'VIEWER';

  const { isMember, isManager } = usePermission(workspaceRole);

  // Ensure workspaces are loaded
  useEffect(() => {
    if (workspaces.length === 0) {
      loadWorkspaces().catch(() => {});
    }
  }, []);

  // Load tasks
  const loadTasks = () => {
    if (!projectId) {
      console.warn('⚠️ loadTasks called without projectId — skipping');
      return;
    }

    const filters = {
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 20,
    };
    loadProjectTasks(projectId, filters);
  };

  // Toggle label filter
  const handleToggleLabel = (labelId) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  // Reload tasks when filters change
  useEffect(() => {
    if (!projectId) return;
    loadTasks();
  }, [projectId, statusFilter, priorityFilter, sortBy, sortOrder, page]);

  // Debounced search (single effect)
  useEffect(() => {
    if (!projectId) return;

    const timer = setTimeout(() => {
      setPage(1);
      loadTasks();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, projectId]);

  // ─── Deep-link: Open task modal from ?taskId=xxx ───
  useEffect(() => {
    const taskIdParam = searchParams.get('taskId');
    if (!taskIdParam) return;

    const fetchAndOpenTask = async () => {
      try {
        const task = await taskApi.getById(taskIdParam);
        setSelectedTask(task);
        setShowDetail(true);
      } catch (error) {
        toast.error('Task not found or you do not have access');
      } finally {
        const next = new URLSearchParams(searchParams);
        next.delete('taskId');
        setSearchParams(next, { replace: true });
      }
    };

    fetchAndOpenTask();
  }, [searchParams, setSearchParams]);

  // Listen for task-updated events (from LabelPicker)
useEffect(() => {
  const handler = async (e) => {
    if (!selectedTask || e.detail?.taskId !== selectedTask.id) return;
    try {
      const fresh = await taskApi.getById(selectedTask.id);
      setSelectedTask(fresh);
      useTaskStore.getState().updateTaskInList(fresh.id, {
        labels: fresh.labels,
      });
    } catch (err) {}
  };

  window.addEventListener('task-updated', handler);
  return () => window.removeEventListener('task-updated', handler);
}, [selectedTask?.id]);
  // ────────────────────────────────────────────────────

  // ⬇️ Filter tasks by selected labels (client-side)
  const filteredTasks =
    selectedLabelIds.length > 0
      ? tasks.filter((task) =>
          selectedLabelIds.some((labelId) =>
            (task.labels || []).some((l) => l.id === labelId)
          )
        )
      : tasks;

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const handleEditTask = () => {
    setShowDetail(false);
    setShowEditModal(true);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setSortBy('position');
    setSortOrder('asc');
    setPage(1);
    setSelectedLabelIds([]);
  };

  const hasActiveFilters = searchQuery || statusFilter || priorityFilter;
  const hasLabelFilters = selectedLabelIds.length > 0;
  const selectClass =
    'px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() =>
              navigate(`/workspaces/${workspaceId}/projects/${projectId}`)
            }
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Back to project"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Tasks
            </h2>
            <p className="text-gray-500 mt-1">
              {pagination?.total || tasks.length} tasks total
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                navigate(
                  `/workspaces/${workspaceId}/projects/${projectId}/board`
                )
              }
            >
              Board View
            </Button>

            {isMember && (
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className={selectClass}
            >
              <option value="position-asc">Default</option>
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2">
              <FunnelIcon className="h-3.5 w-3.5 text-gray-400" />
              <button
                onClick={resetFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Label Filter */}
        {projectId && (
          <div className="mb-6">
            <LabelFilter
              projectId={projectId}
              selectedLabelIds={selectedLabelIds}
              onToggle={handleToggleLabel}
            />
          </div>
        )}

        {/* Tasks List */}
        {isLoading && tasks.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon="✅"
            title={
              hasLabelFilters
                ? 'No tasks match the selected labels'
                : hasActiveFilters
                ? 'No tasks found'
                : 'No tasks yet'
            }
            description={
              hasLabelFilters
                ? 'Try removing some label filters'
                : hasActiveFilters
                ? 'Try adjusting your filters'
                : isMember
                ? 'Create your first task to get started'
                : 'No tasks have been created yet'
            }
            actionLabel={
              !hasActiveFilters && !hasLabelFilters && isMember
                ? 'Create Task'
                : undefined
            }
            onAction={
              !hasActiveFilters && !hasLabelFilters && isMember
                ? () => setShowCreateModal(true)
                : undefined
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    Labels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'DONE';
                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Labels cell */}
                      <td className="px-6 py-4">
                        {task.labels && task.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {task.labels.slice(0, 2).map((label) => (
                              <LabelBadge
                                key={label.id}
                                label={label}
                                size="xs"
                              />
                            ))}
                            {task.labels.length > 2 && (
                              <span className="text-[10px] text-gray-500 self-center">
                                +{task.labels.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.assigneeName ? (
                          <div className="flex items-center">
                            {task.assigneePicture ? (
                              <img
                                src={task.assigneePicture}
                                alt={task.assigneeName}
                                className="h-6 w-6 rounded-full ring-1 ring-gray-100"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-100">
                                <span className="text-indigo-600 text-xs font-medium">
                                  {task.assigneeName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="ml-2 text-sm text-gray-900">
                              {task.assigneeName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.dueDate ? (
                          <div
                            className={`flex items-center text-sm ${
                              isOverdue
                                ? 'text-red-600 font-medium'
                                : 'text-gray-900'
                            }`}
                          >
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-6 py-3.5 flex items-center justify-between border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-900">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-gray-900">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-gray-900">
                    {pagination.total}
                  </span>{' '}
                  results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Task Modal */}
        {isMember && (
          <>
            <TaskModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              projectId={projectId}
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
          </>
        )}

        {/* Task Detail Modal */}
        <TaskDetailModal
          isOpen={showDetail}
           onClose={() => {
    setShowDetail(false);
    setSelectedTask(null);
    // ⬇️ Refetch so labels are fresh
    loadTasks();
  }}
          task={selectedTask}
          onEdit={isMember ? handleEditTask : undefined}
          workspaceRole={workspaceRole}
        />
      </div>
    </ProtectedLayout>
  );
};