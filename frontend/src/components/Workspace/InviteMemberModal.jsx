import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal } from '../UI/Modal';
import { Input } from '../Forms/Input';
import { Button } from '../Forms/Button';
import { useWorkspaceStore } from '../../store/workspace.store';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
});

export const InviteMemberModal = ({ isOpen, onClose, workspaceId }) => {
  const { addMember, isLoading } = useWorkspaceStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'MEMBER' },
  });

  const onSubmit = async (data) => {
    try {
      const result = await addMember(workspaceId, data);

      // Show correct toast based on result type
      if (result?.type === 'added') {
        toast.success(`${data.email} has been added to the workspace`);
      } else if (result?.type === 'invited') {
        toast.success(`Invitation sent to ${data.email}`);
      } else {
        // Fallback if backend didn't return a type
        toast.success('Member added successfully');
      }

      reset();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Member" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600">
          If the user has an account, they'll be added immediately.
          Otherwise, they'll receive an email invitation.
        </p>

        <Input
          label="Email address"
          type="email"
          fullWidth
          placeholder="teammate@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register('role')}
          >
            <option value="VIEWER">Viewer — Read-only access</option>
            <option value="MEMBER">Member — Can create and edit own tasks</option>
            <option value="MANAGER">Manager — Can manage projects and all tasks</option>
            <option value="ADMIN">Admin — Full access except deletion</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Only OWNER can change member roles after they join.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};