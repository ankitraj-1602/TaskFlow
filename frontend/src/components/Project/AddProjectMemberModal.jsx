import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal } from '../UI/Modal';
import { Button } from '../Forms/Button';
import { useProjectStore } from '../../store/project.store';

const addMemberSchema = z.object({
  userId: z.string().uuid('Please select a member'),
  role: z.enum(['MANAGER', 'MEMBER', 'VIEWER']),
});

export const AddProjectMemberModal = ({ isOpen, onClose, projectId }) => {
  const { 
    availableMembers, 
    loadAvailableMembers, 
    addProjectMember, 
    isLoading 
  } = useProjectStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: 'MEMBER' },
  });

  useEffect(() => {
    if (isOpen && projectId) {
      loadAvailableMembers(projectId);
    }
  }, [isOpen, projectId]);

  const onSubmit = async (data) => {
    try {
      await addProjectMember(projectId, data);
      toast.success('Member added to project');
      reset();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Project Member" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {availableMembers.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              All workspace members are already in this project. Invite
              more people to the workspace first.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Member
              </label>
              <select
                className={`w-full px-3 py-2 border ${
                  errors.userId ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                {...register('userId')}
              >
                <option value="">Choose a workspace member...</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.user_id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role in Project
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register('role')}
              >
                <option value="VIEWER">Viewer — Read-only</option>
                <option value="MEMBER">Member — Can create and edit tasks</option>
                <option value="MANAGER">Manager — Can manage project</option>
              </select>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={isLoading}
            disabled={availableMembers.length === 0}
          >
            Add to Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};