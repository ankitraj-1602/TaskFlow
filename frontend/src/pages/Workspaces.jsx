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
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

// Deterministic accent color per workspace, based on name, so the grid doesn't
// look like a wall of identical indigo tiles.
const ACCENTS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100', badge: 'bg-indigo-50 text-indigo-700' },
  { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-100', badge: 'bg-teal-50 text-teal-700' },
  { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100', badge: 'bg-amber-50 text-amber-700' },
  { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100', badge: 'bg-rose-50 text-rose-700' },
  { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100', badge: 'bg-violet-50 text-violet-700' },
];

const getAccent = (name = '') => {
  const code = name.charCodeAt(0) || 0;
  return ACCENTS[code % ACCENTS.length];
};

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Workspaces</h2>
            <p className="text-gray-500 mt-1">Manage your workspaces and collaborate with your team</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="shrink-0">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Workspace
          </Button>
        </div>

        {/* Workspace Grid */}
        {isLoading && workspaces.length === 0 ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-indigo-600"></div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="mx-auto h-14 w-14 rounded-xl bg-indigo-50 flex items-center justify-center">
              <BuildingOffice2Icon className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mt-4">No workspaces yet</h3>
            <p className="text-gray-500 mt-1 text-sm">Create your first workspace to start collaborating with your team</p>
            <Button className="mt-6" onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((workspace) => {
              const accent = getAccent(workspace.name);
              const isOwner = workspace.owner_id === workspace.user_id;
              return (
                <div
                  key={workspace.id}
                  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-shadow p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`h-11 w-11 shrink-0 rounded-xl ${accent.bg} flex items-center justify-center ring-1 ${accent.ring}`}>
                        <span className={`font-semibold text-lg ${accent.text}`}>
                          {workspace.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors cursor-pointer"
                          onClick={() => navigate(`/workspaces/${workspace.id}`)}
                        >
                          {workspace.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {workspace.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity relative z-10">
                      <button
                        onClick={() => navigate(`/workspaces/${workspace.id}/settings`)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        aria-label={`Edit ${workspace.name}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(workspace.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Delete ${workspace.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <UsersIcon className="h-4 w-4 mr-1.5" />
                      <span>{workspace.member_count ?? 0} members</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isOwner ? accent.badge : 'bg-gray-100 text-gray-700'}`}>
                      {isOwner ? 'Owner' : workspace.member_role || 'Member'}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/workspaces/${workspace.id}`)}
                    className="absolute inset-0 w-full h-full opacity-0"
                    aria-label={`Open ${workspace.name}`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Create Workspace Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Create Workspace</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
                  aria-label="Close"
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
                <div className="flex gap-3 pt-1">
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
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Delete Workspace</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Are you sure you want to delete this workspace? This action cannot be undone.
              </p>
              <div className="flex gap-3">
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