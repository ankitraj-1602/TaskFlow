import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Button } from '../components/Forms/Button';
import { MembersTab } from '../components/Workspace/MembersTab';
import { useWorkspaceStore } from '../store/workspace.store';
import { useProjectStore } from '../store/project.store';
import {
  ArrowLeftIcon,
  UsersIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,       // ⬅️ ADD THIS
} from '@heroicons/react/24/outline';
import { ActivityFeed } from '../components/Activity/ActivityFeed';

const tabs = [
  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
  { id: 'members', name: 'Members', icon: UsersIcon },
];

export const WorkspaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workspaces, members, loadWorkspaceMembers, isLoading } = useWorkspaceStore();
  const { projects, loadWorkspaceProjects } = useProjectStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [workspace, setWorkspace] = useState(null);

useEffect(() => {
  const normalizeRole = (w) => {
    if (!w) return 'VIEWER';
    if (w.owner_role === 'OWNER') return 'OWNER';
    if (w.member_role) return w.member_role;
    if (w.userRole) return w.userRole;
    if (w.role) return w.role;
    return 'VIEWER';
  };

  const found = workspaces.find(w => w.id === id);
  if (found) {
    const normalized = {
      ...found,
      userRole: normalizeRole(found),
    };
    console.log('[WorkspaceDetail] workspace:', found);
    console.log('[WorkspaceDetail] normalized userRole:', normalized.userRole);
    setWorkspace(normalized);
    loadWorkspaceMembers(id);
    loadWorkspaceProjects(id);
  } else {
    useWorkspaceStore.getState().loadWorkspaces().then((list) => {
      const w = list.find(x => x.id === id);
      if (w) {
        const normalized = {
          ...w,
          userRole: normalizeRole(w),
        };
        console.log('[WorkspaceDetail] workspace (fallback):', w);
        console.log('[WorkspaceDetail] normalized userRole:', normalized.userRole);
        setWorkspace(normalized);
        loadWorkspaceMembers(id);
        loadWorkspaceProjects(id);
      } else {
        toast.error('Workspace not found');
        navigate('/workspaces');
      }
    });
  }
}, [id, workspaces.length]);

  if (!workspace) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-indigo-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderIcon, color: 'bg-blue-50', iconColor: 'text-blue-600' },
    {
      label: 'Tasks',
      value: projects.reduce((sum, p) => sum + (parseInt(p.task_count) || 0), 0),
      icon: ClipboardDocumentListIcon,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    { label: 'Members', value: members.length, icon: UsersIcon, color: 'bg-violet-50', iconColor: 'text-violet-600' },
    { label: 'Completed', value: '0', icon: ChartBarIcon, color: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/workspaces')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            aria-label="Back to workspaces"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 truncate">{workspace.name}</h2>
            <p className="text-gray-500 mt-0.5">{workspace.description || 'No description'}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/workspaces/${id}/settings`)}
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Settings
            </Button>
            <Button onClick={() => navigate(`/workspaces/${id}/projects`)}>
              <FolderIcon className="h-5 w-5 mr-2" />
              View Projects
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center">
                      <div className={`${stat.color} h-11 w-11 rounded-xl flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                      </div>
                      <div className="ml-3.5">
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <ActivityFeed
                scope="workspace"
                id={id}
                limit={10}
                compact
                emptyMessage="No recent activity"
              />
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <MembersTab workspaceId={id} userRole={workspace.userRole} />
        )}
      </div>
    </ProtectedLayout>
  );
};