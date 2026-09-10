import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { Modal } from '../components/UI/Modal';
import { useProjectStore } from '../store/project.store';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const updateProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const ProjectSettings = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { 
    currentProject, 
    loadProject, 
    updateProject, 
    deleteProject,
    archiveProject,
    unarchiveProject,
    isLoading 
  } = useProjectStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateProjectSchema),
  });

  useEffect(() => {
    loadProject(projectId);
  }, [projectId]);

  useEffect(() => {
    if (currentProject) {
      reset({
        name: currentProject.name,
        description: currentProject.description || '',
        status: currentProject.status,
        startDate: currentProject.start_date 
          ? currentProject.start_date.split('T')[0] 
          : '',
        dueDate: currentProject.due_date 
          ? currentProject.due_date.split('T')[0] 
          : '',
      });
    }
  }, [currentProject]);

  const onSubmit = async (data) => {
    try {
      await updateProject(projectId, data);
      toast.success('Project updated successfully');
      navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update project');
    }
  };

  const onDelete = async () => {
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
      navigate(`/workspaces/${workspaceId}/projects`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const onToggleArchive = async () => {
    try {
      if (currentProject.is_archived) {
        await unarchiveProject(projectId);
        toast.success('Project unarchived');
      } else {
        await archiveProject(projectId);
        toast.success('Project archived');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive/unarchive');
    }
  };

  if (!currentProject) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Project Settings</h2>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Project Name"
              type="text"
              fullWidth
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className={`w-full px-3 py-2 border ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register('status')}
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                fullWidth
                {...register('startDate')}
              />
              <Input
                label="Due Date"
                type="date"
                fullWidth
                {...register('dueDate')}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/workspaces/${workspaceId}/projects/${projectId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Archive Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentProject.is_archived ? 'Unarchive Project' : 'Archive Project'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {currentProject.is_archived
              ? 'Restore this project to active status.'
              : 'Archiving hides the project from the main view but preserves all data.'}
          </p>
          <Button variant="secondary" onClick={onToggleArchive} loading={isLoading}>
            {currentProject.is_archived ? 'Unarchive Project' : 'Archive Project'}
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-gray-600 text-sm mb-4">
            Once you delete a project, all tasks and data will be permanently deleted.
          </p>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete Project
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Project"
          size="sm"
        >
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete <strong>{currentProject.name}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete} loading={isLoading}>
              Yes, Delete
            </Button>
          </div>
        </Modal>
      </div>
    </ProtectedLayout>
  );
};