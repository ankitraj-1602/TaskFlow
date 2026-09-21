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
import { LabelPicker } from '../Label/LabelPicker';
import { taskApi } from '../../api/task.api';
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

  // Local copy of the task — allows in-place refresh after label changes
  const [localTask, setLocalTask] = useState(task);

  // Sync local copy when parent passes a new task
  useEffect(() => {
    setLocalTask(task);
  }, [task?.id]);

  // Refetch handler for LabelPicker
  const handleLabelUpdate = async () => {
    if (!localTask?.id) return;
    try {
      const fresh = await taskApi.getById(localTask.id);
      setLocalTask(fresh);
    } catch (err) {
      // Silent — labels may be stale but task still renders
    }
  };

  // ─── RBAC ─────────────────────────────────────────
  const { isMember, isManager } = usePermission(workspaceRole);

  const isOwnTask =
    localTask &&
    (localTask.createdById === user?.id ||
      localTask.assigneeUserId === user?.id ||
      localTask.assigneeId === user?.id);

  const canEdit = isManager || (isMember && isOwnTask);
  const canDelete = isManager;
  const canArchive = isManager;
  const canDuplicate = isMember;

  const hasAnyAction = canEdit || canDelete || canArchive || canDuplicate;
  // ──────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && localTask?.projectId) {
      loadProjectMembers(localTask.projectId);
    }
    if (isOpen && localTask?.id) {
      invalidateTask(localTask.id);
    }
  }, [isOpen, localTask?.projectId, localTask?.id]);

  if (!localTask) return null;

  const handleDelete = async () => {
    try {
      await deleteTask(localTask.id);
      toast.success('Task deleted');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateTask(localTask.id);
      toast.success('Task duplicated');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to duplicate task');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveTask(localTask.id);
      toast.success('Task archived');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to archive task');
    }
  };

  const isOverdue =
    localTask.dueDate &&
    new Date(localTask.dueDate) < new Date() &&
    localTask.status !== 'DONE';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900 flex-1">
              {localTask.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={localTask.status} />
              <PriorityBadge priority={localTask.priority} />
            </div>
          </div>
          {localTask.description && (
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {localTask.description}
            </p>
          )}
        </div>

        {/* Labels */}
        <div className="py-3">
          <p className="text-xs text-gray-500 mb-2">Labels</p>
          <LabelPicker
            taskId={localTask.id}
            projectId={localTask.projectId}
            currentLabels={localTask.labels || []}
            disabled={!canEdit}
            onUpdate={handleLabelUpdate}
          />
        </div>

        {/* Meta Grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 py-4 border-t border-b border-gray-100">
          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Assignee</dt>
            {localTask.assigneeName ? (
              <dd className="flex items-center gap-2">
                {localTask.assigneePicture ? (
                  <img
                    src={localTask.assigneePicture}
                    alt={localTask.assigneeName}
                    className="h-6 w-6 rounded-full ring-1 ring-gray-100"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-100">
                    <span className="text-indigo-600 text-xs font-medium">
                      {localTask.assigneeName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-900">
                  {localTask.assigneeName}
                </span>
              </dd>
            ) : (
              <dd className="text-sm text-gray-500">Unassigned</dd>
            )}
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Reporter</dt>
            <dd className="text-sm text-gray-900">
              {localTask.createdByName || 'Unknown'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Due Date</dt>
            <dd
              className={`text-sm ${
                isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'
              }`}
            >
              {localTask.dueDate
                ? new Date(localTask.dueDate).toLocaleDateString()
                : 'Not set'}
              {isOverdue && ' (Overdue)'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">
              Story Points
            </dt>
            <dd className="text-sm text-gray-900">
              {localTask.storyPoints || '—'}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Created</dt>
            <dd className="text-sm text-gray-900">
              {new Date(localTask.createdAt).toLocaleDateString()}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-gray-500 mb-1">Updated</dt>
            <dd className="text-sm text-gray-900">
              {new Date(localTask.updatedAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        {/* Counts */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center">
            <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" />
            <span>{localTask.commentCount || 0} comments</span>
          </div>
          <div className="flex items-center">
            <PaperClipIcon className="h-4 w-4 mr-1.5" />
            <span>{localTask.attachmentCount || 0} attachments</span>
          </div>
        </div>

        {/* Comments */}
        <div className="pt-4 border-t border-gray-100">
          <CommentList taskId={localTask.id} workspaceRole={workspaceRole} />
        </div>

        {/* Activity */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Activity</h4>
          <ActivityFeed scope="task" id={localTask.id} compact />
        </div>

        {/* Attachments */}
        <div className="pt-4 border-t border-gray-200">
          <AttachmentList
            taskId={localTask.id}
            workspaceRole={workspaceRole}
          />
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