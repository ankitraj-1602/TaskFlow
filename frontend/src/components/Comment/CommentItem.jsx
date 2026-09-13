import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { CommentInput } from './CommentInput';
import { MentionText } from './MentionText';
import {
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const CommentItem = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onUpdate,
  editingId,
  replyTo,
  onSubmitReply,
  submitting,
  isMember,
  isManager,
  isReply = false,
}) => {
  const { user } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwn = comment.authorId === user?.id;
  const canEdit = isOwn;
  const canDelete = isOwn || isManager;
  const isEditing = editingId === comment.id;
  const isReplying = replyTo === comment.id;

  const initials = comment.authorName?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={isReply ? 'ml-10 mt-3' : ''}>
      <div className="flex gap-3">
        {comment.authorPicture ? (
          <img
            src={comment.authorPicture}
            alt={comment.authorName}
            className="h-8 w-8 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 text-xs font-semibold">
              {initials}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {comment.authorName || 'Unknown'}
            </span>
            <span className="text-xs text-gray-400">
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <CommentInput
              initialValue={comment.content}
              onSubmit={(content) => onUpdate(comment.id, content)}
              onCancel={() => onEdit(null)}
              submitting={submitting}
              submitLabel="Save"
              autoFocus
            />
          ) : (
            <>
              <MentionText
                content={comment.content}
                className="text-sm text-gray-700 whitespace-pre-wrap"
              />

              <div className="flex items-center gap-3 mt-1">
                {!isReply && isMember && (
                  <button
                    onClick={() => onReply(comment.id)}
                    className="text-xs text-gray-500 hover:text-indigo-600"
                  >
                    Reply
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => onEdit(comment.id)}
                    className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <PencilSquareIcon className="h-3 w-3" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>

              {showDeleteConfirm && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <p className="text-gray-800 mb-2">Delete this comment?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onDelete(comment.id);
                        setShowDeleteConfirm(false);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {isReplying && (
                <div className="mt-3">
                  <CommentInput
                    placeholder={`Reply to ${comment.authorName}...`}
                    onSubmit={onSubmitReply}
                    onCancel={() => onReply(null)}
                    submitting={submitting}
                    autoFocus
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
              editingId={editingId}
              replyTo={replyTo}
              onSubmitReply={onSubmitReply}
              submitting={submitting}
              isMember={isMember}
              isManager={isManager}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
};