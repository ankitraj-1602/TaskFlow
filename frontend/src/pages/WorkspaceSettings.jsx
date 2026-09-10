import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useWorkspaceStore } from '../store/workspace.store';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const updateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

export const WorkspaceSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { workspaces, updateWorkspace, deleteWorkspace, isLoading } = useWorkspaceStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateWorkspaceSchema),
  });

  useEffect(() => {
    const workspace = workspaces.find(w => w.id === id);
    if (workspace) {
      reset({
        name: workspace.name,
        description: workspace.description || '',
      });
    }
  }, [id, workspaces]);

  const onSubmit = async (data) => {
    try {
      await updateWorkspace(id, data);
      toast.success('Workspace updated successfully');
      navigate(`/workspaces/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update workspace');
    }
  };

  const onDelete = async () => {
    try {
      await deleteWorkspace(id);
      toast.success('Workspace deleted successfully');
      navigate('/workspaces');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete workspace');
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(`/workspaces/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Workspace Settings</h2>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Workspace Name"
              type="text"
              fullWidth
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Description"
              type="text"
              fullWidth
              error={errors.description?.message}
              {...register('description')}
            />
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/workspaces/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-gray-600 text-sm mb-4">
            Once you delete a workspace, there is no going back. Please be certain.
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Workspace
          </Button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Workspace</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this workspace? All projects and tasks will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={onDelete}
                  loading={isLoading}
                >
                  Yes, Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
};