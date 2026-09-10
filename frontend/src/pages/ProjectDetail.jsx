import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Button } from '../components/Forms/Button';
import { StatusBadge } from '../components/UI/StatusBadge';
import { useProjectStore } from '../store/project.store';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ViewColumnsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

export const ProjectDetail = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, loadProject, isLoading } = useProjectStore();

  useEffect(() => {
    loadProject(projectId);
  }, [projectId]);

  if (isLoading || !currentProject) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  const project = currentProject;
  const stats = project.stats || {};

  const statCards = [
    { 
      label: 'To Do', 
      value: stats.todo || 0, 
      icon: ListBulletIcon, 
      color: 'bg-gray-500' 
    },
    { 
      label: 'In Progress', 
      value: stats.inProgress || 0, 
      icon: ClockIcon, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Review', 
      value: stats.review || 0, 
      icon: ExclamationTriangleIcon, 
      color: 'bg-yellow-500' 
    },
    { 
      label: 'Done', 
      value: stats.done || 0, 
      icon: CheckCircleIcon, 
      color: 'bg-green-500' 
    },
  ];

  const progress = stats.total > 0 
    ? Math.round((stats.done / stats.total) * 100) 
    : 0;

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/projects`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <StatusBadge status={project.status} size="lg" />
            </div>
            <p className="text-gray-600 mt-1">
              {project.description || 'No description'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/settings`)}
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Settings
            </Button>
            <Button onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/board`)}>
              <ViewColumnsIcon className="h-5 w-5 mr-2" />
              Open Board
            </Button>
            <Button onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)}>
  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
  View Tasks
</Button>
          </div>
        </div>

        {/* Project Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
            <UserGroupIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-xs text-gray-500">Owner</p>
              <p className="text-sm font-medium text-gray-900">
                {project.owner_name || project.created_by_name || 'Unassigned'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="text-sm font-medium text-gray-900">
                {project.due_date 
                  ? new Date(project.due_date).toLocaleDateString() 
                  : 'Not set'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-3">
            <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-xs text-gray-500">Total Tasks</p>
              <p className="text-sm font-medium text-gray-900">
                {stats.total || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className={`${stat.color} h-10 w-10 rounded-lg flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-sm text-gray-600">
            <span>{stats.done || 0} of {stats.total || 0} tasks completed</span>
            {stats.overdue > 0 && (
              <span className="text-red-600 font-medium">
                {stats.overdue} overdue
              </span>
            )}
          </div>
        </div>

        {/* Recent Tasks / Empty State */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
          <div className="text-center py-8 text-gray-500">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No tasks yet</p>
            <p className="text-sm mt-1">Open the Kanban board to start adding tasks</p>
            <Button
              className="mt-4"
              onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}/board`)}
            >
              Go to Board
            </Button>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
};