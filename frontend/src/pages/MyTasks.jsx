import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { StatusBadge } from '../components/UI/StatusBadge';
import { PriorityBadge } from '../components/UI/PriorityBadge';
import { EmptyState } from '../components/UI/EmptyState';
import { TaskDetailModal } from '../components/Task/TaskDetailModal';
import { Button } from '../components/Forms/Button';
import { useTaskStore } from '../store/task.store';
import { taskApi } from '../api/task.api';
import { LabelBadge } from '../components/Label/LabelBadge';
import { CalendarIcon } from '@heroicons/react/24/outline';

export const MyTasks = () => {
  const navigate = useNavigate();
  const { myTasks, myTasksPagination, loadMyTasks, isLoading } = useTaskStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadMyTasks({
      status: statusFilter || undefined,
      page,
      limit: 20,
    });
  }, [statusFilter, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ─── Listen for task-updated events (from LabelPicker) ───
  useEffect(() => {
    const handler = async (e) => {
      if (!selectedTask || e.detail?.taskId !== selectedTask.id) return;
      try {
        const fresh = await taskApi.getById(selectedTask.id);
        setSelectedTask(fresh);
        // Update the row in the list so labels appear without refresh
        useTaskStore.getState().updateTaskInList(fresh.id, {
          labels: fresh.labels,
        });
      } catch (err) {
        // Silent
      }
    };

    window.addEventListener('task-updated', handler);
    return () => window.removeEventListener('task-updated', handler);
  }, [selectedTask?.id]);
  // ──────────────────────────────────────────────────────────

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              My Tasks
            </h2>
            <p className="text-gray-500 mt-1">
              {myTasksPagination
                ? `${myTasksPagination.total} task${myTasksPagination.total !== 1 ? 's' : ''} assigned to you`
                : 'Tasks assigned to you across all projects'}
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shrink-0"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Task List */}
        {isLoading && myTasks.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : myTasks.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No tasks assigned"
            description={
              statusFilter
                ? 'No tasks match your filter'
                : "You don't have any tasks assigned to you right now"
            }
          />
        ) : (
          <>
            <div className="space-y-2.5">
              {myTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== 'DONE';
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 cursor-pointer transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {task.title}
                          </h3>
                          <StatusBadge status={task.status} size="sm" />
                          <PriorityBadge priority={task.priority} size="sm" />
                        </div>

                        {/* ⬇️ Labels on My Tasks row */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {task.labels.slice(0, 3).map((label) => (
                              <LabelBadge
                                key={label.id}
                                label={label}
                                size="xs"
                              />
                            ))}
                            {task.labels.length > 3 && (
                              <span className="text-[10px] text-gray-500 self-center">
                                +{task.labels.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {task.projectName && (
                          <p className="text-xs text-gray-500 font-medium mt-1.5">
                            {task.projectName}
                          </p>
                        )}
                      </div>
                      {task.dueDate && (
                        <div
                          className={`flex items-center text-xs shrink-0 ${
                            isOverdue
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {myTasksPagination && myTasksPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{myTasksPagination.page}</span> of{' '}
                  <span className="font-medium">{myTasksPagination.totalPages}</span>
                  {' '}— Showing{' '}
                  <span className="font-medium">
                    {(myTasksPagination.page - 1) * myTasksPagination.limit + 1}-
                    {Math.min(
                      myTasksPagination.page * myTasksPagination.limit,
                      myTasksPagination.total
                    )}
                  </span>{' '}
                  of <span className="font-medium">{myTasksPagination.total}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= myTasksPagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <TaskDetailModal
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
        />
      </div>
    </ProtectedLayout>
  );
};