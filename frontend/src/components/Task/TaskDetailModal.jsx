import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../UI/Modal';
import { Button } from '../Forms/Button';
import { StatusBadge } from '../UI/StatusBadge';
import { PriorityBadge } from '../UI/PriorityBadge';
import { CommentList } from '../Comment/CommentList';
import { useTaskStore } from '../../store/task.store';
import { useAuthStore } from '../../store/auth.store';
import { useProjectStore } from '../../store/project.store';
import { usePermission } from '../../hooks/usePermission';
import { ActivityFeed } from '../Activity/ActivityFeed';
import { useActivityStore } from '../../store/activity.store';
import { AttachmentList } from '../Attachment/AttachmentList';
import {
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export const TaskDetailModal = ({
  isOpen,
  onClose,
  task,
  onEdit,
  workspaceRole,
}) => {
  const { deleteTask, duplicateTask, archiveTask, isLoading } = useTaskStore();
  const { user } = useAuthStore();
  const { loadProjectMembers } = useProjectStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { invalidateTask } = useActivityStore();

  // ─── RBAC ─────────────────────────────────────────
  const { isMember, isManager } = usePermission(workspaceRole);

  const isOwnTask =
    task &&
    (task.createdById === user?.id ||
      task.assigneeUserId === user?.id ||
      task.assigneeId === user?.id);

  const canEdit = isManager || (isMember && isOwnTask);
  const canDelete = isManager;
  const canArchive = isManager;
  const canDuplicate = isMember;

  const hasAnyAction = canEdit || canDelete || canArchive || canDuplicate;
  // ──────────────────────────────────────────────────

  // ─── Load project members for @mention autocomplete
  useEffect(() => {
    if (isOpen && task?.projectId) {
      loadProjectMembers(task.projectId);
    }
    if (isOpen && task?.id) {
      // Refresh activity every time the modal opens
      invalidateTask(task.id);
    }
  }, [isOpen, task?.projectId, task?.id]);
  // ──────────────────────────────────────────────────

  if (!task) return null;

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateTask(task.id);
      toast.success('Task duplicated');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to duplicate task');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveTask(task.id);
      toast.success('Task archived');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive task');
    }
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900 flex-1">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
          {task.description && (
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {task.description}
            </p>
          )}
        </div>

        {/* Meta Grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 py-4 border-t border-b border-gray-100">
          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Assignee</dt>
            {task.assigneeName ? (
              <dd className="flex items-center gap-2">
                {task.assigneePicture ? (
                  <img
                    src={task.assigneePicture}
                    alt={task.assigneeName}
                    className="h-6 w-6 rounded-full ring-1 ring-gray-100"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-100">
                    <span className="text-indigo-600 text-xs font-medium">
                      {task.assigneeName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-900">
                  {task.assigneeName}
                </span>
              </dd>
            ) : (
              <dd className="text-sm text-gray-500">Unassigned</dd>
            )}
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Reporter</dt>
            <dd className="text-sm text-gray-900">
              {task.createdByName || 'Unknown'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Due Date</dt>
            <dd
              className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'
                }`}
            >
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : 'Not set'}
              {isOverdue && ' (Overdue)'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Story Points</dt>
            <dd className="text-sm text-gray-900">{task.storyPoints || '—'}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Created</dt>
            <dd className="text-sm text-gray-900">
              {new Date(task.createdAt).toLocaleDateString()}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Updated</dt>
            <dd className="text-sm text-gray-900">
              {new Date(task.updatedAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {/* Counts */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center">
            <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" />
            <span>{task.commentCount || 0} comments</span>
          </div>
          <div className="flex items-center">
            <PaperClipIcon className="h-4 w-4 mr-1.5" />
            <span>{task.attachmentCount || 0} attachments</span>
          </div>
        </div>

        {/* Comments */}
        <div className="pt-4 border-t border-gray-100">
          <CommentList taskId={task.id} workspaceRole={workspaceRole} />
        </div>
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Activity</h4>
          <ActivityFeed scope="task" id={task.id} compact />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <AttachmentList taskId={task.id} workspaceRole={workspaceRole} />
        </div>

        {/* Actions */}
        {hasAnyAction ? (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {canArchive && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleArchive}
                  loading={isLoading}
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                  Archive
                </Button>
              )}
              {canDuplicate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDuplicate}
                  loading={isLoading}
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canDelete && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              {canEdit && onEdit && (
                <Button size="sm" onClick={onEdit}>
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              You have read-only access to this task.
            </p>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50/60 rounded-xl border border-red-100">
            <div className="flex items-start gap-2.5 mb-3">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={isLoading}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};