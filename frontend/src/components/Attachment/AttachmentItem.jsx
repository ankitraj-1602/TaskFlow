import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { getFileIcon } from './fileIcon';
import { formatFileSize } from '../../utils/formatFileSize';
import { attachmentApi } from '../../api/attachment.api';
import { useAttachmentStore } from '../../store/attachment.store';
import { useAuthStore } from '../../store/auth.store';
import { usePermission } from '../../hooks/usePermission';
import { Button } from '../Forms/Button';

export const AttachmentItem = ({ attachment, taskId, workspaceRole }) => {
  const { user } = useAuthStore();
  const { deleteAttachment } = useAttachmentStore();
  const { isManager } = usePermission(workspaceRole);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { Icon, color } = getFileIcon(attachment.mimeType);
  const isImage = attachment.mimeType?.startsWith('image/');
  const fullUrl = attachmentApi.getFileUrl(attachment.fileUrl);
  const canDelete =
    attachment.uploadedById === user?.id || isManager;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAttachment(attachment.id, taskId);
      toast.success('Attachment deleted');
      setShowConfirm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    window.open(fullUrl, '_blank');
  };

  const handlePreview = () => {
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* Icon or thumbnail */}
      {isImage ? (
        <img
          src={fullUrl}
          alt={attachment.fileName}
          className="h-10 w-10 rounded object-cover flex-shrink-0 cursor-pointer"
          onClick={handlePreview}
        />
      ) : (
        <div className="h-10 w-10 rounded bg-gray-50 flex items-center justify-center flex-shrink-0">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-indigo-600"
          onClick={handlePreview}
          title={attachment.fileName}
        >
          {attachment.fileName}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatFileSize(attachment.fileSize)} ·{' '}
          {attachment.uploaderName || 'Unknown'} ·{' '}
          {formatDistanceToNow(new Date(attachment.uploadedAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handlePreview}
          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          title="Preview"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          title="Download"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
        </button>
        {canDelete && (
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center px-4">
            <p className="text-sm text-gray-900 mb-3">
              Delete <strong>{attachment.fileName}</strong>?
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};