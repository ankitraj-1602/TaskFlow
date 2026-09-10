import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { StatusBadge } from '../components/UI/StatusBadge';
import { PriorityBadge } from '../components/UI/PriorityBadge';
import { EmptyState } from '../components/UI/EmptyState';
import { TaskDetailModal } from '../components/Task/TaskDetailModal';
import { useTaskStore } from '../store/task.store';
import { CalendarIcon } from '@heroicons/react/24/outline';

export const MyTasks = () => {
  const navigate = useNavigate();
  const { myTasks, loadMyTasks, isLoading } = useTaskStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadMyTasks({ status: statusFilter || undefined });
  }, [statusFilter]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
            <p className="text-gray-600 mt-1">
              Tasks assigned to you across all projects
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {isLoading && myTasks.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : myTasks.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No tasks assigned"
            description="You don't have any tasks assigned to you right now"
          />
        ) : (
          <div className="space-y-3">
            {myTasks.map((task) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h3>
                        <StatusBadge status={task.status} size="sm" />
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>
                      <p className="text-xs text-gray-500">
                        {task.projectName && (
                          <span className="font-medium text-gray-600">
                            {task.projectName}
                          </span>
                        )}
                      </p>
                    </div>
                    {task.dueDate && (
                      <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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