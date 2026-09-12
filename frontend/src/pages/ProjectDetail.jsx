import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Button } from '../components/Forms/Button';
import { StatusBadge } from '../components/UI/StatusBadge';
import { ProjectMembersTab } from '../components/Project/ProjectMembersTab';
import { useProjectStore } from '../store/project.store';
import { useWorkspaceStore } from '../store/workspace.store';
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
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const tabs = [
  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
  { id: 'members', name: 'Members', icon: UserGroupIcon },
];

export const ProjectDetail = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, loadProject, isLoading } = useProjectStore();
  const { workspaces } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Determine workspace role
  const workspace = workspaces.find((w) => w.id === workspaceId);
  const workspaceRole =
    workspace?.owner_role === 'OWNER'
      ? 'OWNER'
      : workspace?.member_role || workspace?.userRole || 'VIEWER';

  useEffect(() => {
    loadProject(projectId);
  }, [projectId]);

  useEffect(() => {
  if (workspaces.length === 0) {
    useWorkspaceStore.getState().loadWorkspaces().catch(() => {});
  }
}, []);

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
    { label: 'To Do', value: stats.todo || 0, icon: ListBulletIcon, color: 'bg-gray-500' },
    { label: 'In Progress', value: stats.inProgress || 0, icon: ClockIcon, color: 'bg-blue-500' },
    { label: 'Review', value: stats.review || 0, icon: ExclamationTriangleIcon, color: 'bg-yellow-500' },
    { label: 'Done', value: stats.done || 0, icon: CheckCircleIcon, color: 'bg-green-500' },
  ];

  const progress =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

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
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/projects/${projectId}/settings`)
              }
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Settings
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)
              }
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              View Tasks
            </Button>
            <Button
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/projects/${projectId}/board`)
              }
            >
              <ViewColumnsIcon className="h-5 w-5 mr-2" />
              Open Board
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`${stat.color} h-10 w-10 rounded-lg flex items-center justify-center`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                <span className="text-2xl font-bold text-indigo-600">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-sm text-gray-600">
                <span>
                  {stats.done || 0} of {stats.total || 0} tasks completed
                </span>
                {stats.overdue > 0 && (
                  <span className="text-red-600 font-medium">
                    {stats.overdue} overdue
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Members */}
       {activeTab === 'members' && (
  <ProjectMembersTab
    projectId={projectId}
    workspaceRole={workspaceRole}
  />
)}
      </div>
    </ProtectedLayout>
  );
};