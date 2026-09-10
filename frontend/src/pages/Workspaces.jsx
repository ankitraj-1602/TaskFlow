import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useWorkspaceStore } from '../store/workspace.store';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

export const Workspaces = () => {
  const navigate = useNavigate();
  const { workspaces, loadWorkspaces, createWorkspace, deleteWorkspace, isLoading } = useWorkspaceStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createWorkspaceSchema),
  });

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const onCreateWorkspace = async (data) => {
    try {
      await createWorkspace(data);
      toast.success('Workspace created successfully!');
      setShowCreateModal(false);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create workspace');
    }
  };

  const onDeleteWorkspace = async (id) => {
    try {
      await deleteWorkspace(id);
      toast.success('Workspace deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workspaces</h2>
            <p className="text-gray-600 mt-1">Manage your workspaces and collaborate with your team</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            New Workspace
          </Button>
        </div>

        {/* Workspace Grid */}
        {isLoading && workspaces.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900">No workspaces yet</h3>
            <p className="text-gray-600 mt-1">Create your first workspace to get started</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-lg">
                          {workspace.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3
                          className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                          onClick={() => navigate(`/workspaces/${workspace.id}`)}
                        >
                          {workspace.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {workspace.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => navigate(`/workspaces/${workspace.id}/settings`)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(workspace.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    <span>0 members</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {workspace.owner_id === workspace.user_id ? 'Owner' : workspace.member_role || 'Member'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/workspaces/${workspace.id}`)}
                  className="absolute inset-0 w-full h-full opacity-0"
                  aria-label={`Open ${workspace.name}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Create Workspace Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create Workspace</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit(onCreateWorkspace)} className="space-y-4">
                <Input
                  label="Workspace Name"
                  type="text"
                  fullWidth
                  placeholder="My Company"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Description (optional)"
                  type="text"
                  fullWidth
                  placeholder="Main company workspace"
                  error={errors.description?.message}
                  {...register('description')}
                />
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isLoading}>
                    Create Workspace
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Workspace</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this workspace? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => onDeleteWorkspace(showDeleteConfirm)}
                  loading={isLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
};