import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import { useCommentStore } from '../../store/comment.store';
import { usePermission } from '../../hooks/usePermission';

export const CommentList = ({ taskId, workspaceRole }) => {
  const {
    comments,
    isLoading,
    loadComments,
    addComment,
    updateComment,
    deleteComment,
  } = useCommentStore();

  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const { isMember } = usePermission(workspaceRole);

  useEffect(() => {
    if (taskId) {
      loadComments(taskId).catch(() => {
        toast.error('Failed to load comments');
      });
    }
  }, [taskId]);

  const handleSubmitTopLevel = async (content) => {
    setSubmitting(true);
    try {
      await addComment(taskId, { content });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (content) => {
    if (!replyTo) return;
    setSubmitting(true);
    try {
      await addComment(taskId, { content, parentId: replyTo });
      setReplyTo(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId, content) => {
    try {
      await updateComment(commentId, content);
      toast.success('Comment updated');
      setEditingId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const totalComments = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">
        Comments ({totalComments})
      </h4>

      {isMember ? (
        <CommentInput
          onSubmit={handleSubmitTopLevel}
          placeholder="Add a comment... Use @email to mention someone"
          submitting={submitting}
        />
      ) : (
        <p className="text-xs text-gray-500 italic">
          You have read-only access. Sign in with a member role to comment.
        </p>
      )}

      {isLoading && comments.length === 0 ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(id) => setReplyTo(id)}
              onEdit={(id) => setEditingId(id)}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              editingId={editingId}
              replyTo={replyTo}
              onSubmitReply={handleSubmitReply}
              submitting={submitting}
              isMember={isMember}
              isManager={['OWNER', 'ADMIN', 'MANAGER'].includes(workspaceRole)}
            />
          ))}
        </div>
      )}
    </div>
  );
};