import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { AttachmentItem } from './AttachmentItem';
import { AttachmentUpload } from './AttachmentUpload';
import { useAttachmentStore } from '../../store/attachment.store';
import { usePermission } from '../../hooks/usePermission';

export const AttachmentList = ({ taskId, workspaceRole }) => {
  const { attachmentsByTask, loadTaskAttachments, isLoading } =
    useAttachmentStore();
  const { isMember } = usePermission(workspaceRole);
  const attachments = attachmentsByTask[taskId] || [];

  useEffect(() => {
    if (taskId) {
      loadTaskAttachments(taskId).catch(() => {
        toast.error('Failed to load attachments');
      });
    }
  }, [taskId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PaperClipIcon className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          Attachments ({attachments.length})
        </h4>
      </div>

      {/* Upload zone — only for members */}
      {isMember && (
        <AttachmentUpload taskId={taskId} disabled={!isMember} />
      )}

      {/* List */}
      {isLoading && attachments.length === 0 ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-gray-500 italic text-center py-3">
          No attachments yet
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div key={a.id} className="relative">
              <AttachmentItem
                attachment={a}
                taskId={taskId}
                workspaceRole={workspaceRole}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};