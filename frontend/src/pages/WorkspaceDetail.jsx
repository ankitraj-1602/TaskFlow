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
} from '@heroicons/react/24/outline';

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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderIcon, color: 'bg-blue-500' },
    { 
      label: 'Tasks', 
      value: projects.reduce((sum, p) => sum + (parseInt(p.task_count) || 0), 0), 
      icon: ClipboardDocumentListIcon, 
      color: 'bg-green-500' 
    },
    { label: 'Members', value: members.length, icon: UsersIcon, color: 'bg-purple-500' },
    { label: 'Completed', value: '0', icon: ChartBarIcon, color: 'bg-orange-500' },
  ];

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/workspaces')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{workspace.name}</h2>
            <p className="text-gray-600">{workspace.description || 'No description'}</p>
          </div>
          <Button onClick={() => navigate(`/workspaces/${id}/projects`)}>
            View Projects
          </Button>
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className={`${stat.color} h-10 w-10 rounded-lg flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <p className="text-gray-500 text-sm">No recent activity to show</p>
            </div>
          </div>
        )}

{activeTab === 'members' && (
<MembersTab workspaceId={id} userRole={workspace.userRole} />
)}      </div>
    </ProtectedLayout>
  );
};