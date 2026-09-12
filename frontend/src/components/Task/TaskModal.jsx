import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Modal } from '../UI/Modal';
import { Input } from '../Forms/Input';
import { Button } from '../Forms/Button';
import { useTaskStore } from '../../store/task.store';
import { useProjectStore } from '../../store/project.store';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional().nullable(),
  storyPoints: z.coerce.number().int().min(0).max(100).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const TaskModal = ({ isOpen, onClose, task, projectId, defaultStatus }) => {
  const { createTask, updateTask, isLoading } = useTaskStore();
  const { projectMembers, loadProjectMembers } = useProjectStore();
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus || 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
      storyPoints: '',
      assigneeId: '',
    },
  });

  // Load project members when modal opens for a project
  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectMembers(projectId);
    }
  }, [isOpen, projectId]);

  // Reset form when modal opens or task changes
  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      // Editing: pre-fill with task data
      reset({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        storyPoints: task.storyPoints ?? '',
        // ⬇️ Use assigneeUserId (users.id) — matches dropdown option values
        assigneeId: task.assigneeUserId || '',
      });
    } else {
      // Creating: empty form
      reset({
        title: '',
        description: '',
        status: defaultStatus || 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
        storyPoints: '',
        assigneeId: '',
      });
    }
  }, [isOpen, task, defaultStatus, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || null,
        storyPoints: data.storyPoints === '' ? null : data.storyPoints,
        assigneeId: data.assigneeId || null,
      };

      if (isEditing) {
        await updateTask(task.id, payload);
        toast.success('Task updated successfully');
      } else {
        await createTask(projectId, payload);
        toast.success('Task created successfully');
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Title"
          type="text"
          fullWidth
          placeholder="Task title"
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Describe the task..."
            className={`w-full px-3 py-2 border ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('status')}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('priority')}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            fullWidth
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
          <Input
            label="Story Points"
            type="number"
            fullWidth
            placeholder="0"
            error={errors.storyPoints?.message}
            {...register('storyPoints')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register('assigneeId')}
          >
            <option value="">Unassigned</option>
            {projectMembers.map((member) => (
              <option key={member.id} value={member.user_id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};