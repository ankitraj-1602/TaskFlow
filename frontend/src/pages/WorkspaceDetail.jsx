import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Button } from '../components/Forms/Button';
import { useWorkspaceStore } from '../store/workspace.store';
import { 
  ArrowLeftIcon, 
  UsersIcon, 
  FolderIcon, 
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const WorkspaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, loadWorkspaceMembers, members, isLoading } = useWorkspaceStore();
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        // This would be fetched from API
        // For now, we'll use the store
        const workspaces = await useWorkspaceStore.getState().loadWorkspaces();
        const found = workspaces.find(w => w.id === id);
        if (found) {
          setWorkspace(found);
          await loadWorkspaceMembers(id);
        }
      } catch (error) {
        toast.error('Failed to load workspace');
        navigate('/workspaces');
      }
    };

    loadWorkspace();
  }, [id]);

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
    { label: 'Projects', value: '0', icon: FolderIcon, color: 'bg-blue-500' },
    { label: 'Tasks', value: '0', icon: ClipboardDocumentListIcon, color: 'bg-green-500' },
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{workspace.name}</h2>
            <p className="text-gray-600">{workspace.description || 'No description'}</p>
          </div>
          <div className="ml-auto flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => navigate(`/workspaces/${id}/settings`)}
            >
              Settings
            </Button>
            <Button onClick={() => navigate(`/workspaces/${id}/projects`)}>
              View Projects
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

        {/* Recent Activity & Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <p className="text-gray-500 text-sm">No recent activity to show</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : members.length === 0 ? (
              <p className="text-gray-500 text-sm">No members yet</p>
            ) : (
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {member.profile_picture ? (
                        <img
                          src={member.profile_picture}
                          alt={member.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {member.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {member.role}
                    </span>
                  </div>
                ))}
                {members.length > 5 && (
                  <button
                    onClick={() => navigate(`/workspaces/${id}/members`)}
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    View all {members.length} members →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
};