import { useEffect } from 'react';
import { useSocketStore } from '../store/socket.store';
import { useAuthStore } from '../store/auth.store';
import { useTaskStore } from '../store/task.store';
import { useCommentStore } from '../store/comment.store';
import { useActivityStore } from '../store/activity.store';
import { useNotificationStore } from '../store/notification.store';
import { useAttachmentStore } from '../store/attachment.store';

export const useSocketEvents = () => {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    // Snapshot the current user ID at listener registration.
    // Refresh on every socket change to keep it current.
    const getCurrentUserId = () => useAuthStore.getState().user?.id;

    // ─── Task events ─────────────────────────────────
    const onTaskCreated = ({ task, actorId }) => {
      // Skip if we're the actor — optimistic add already handled it
      if (actorId === getCurrentUserId()) return;
      useTaskStore.getState().addTaskFromSocket(task);
    };

    const onTaskUpdated = ({ task, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useTaskStore.getState().updateTaskFromSocket(task);
    };

    const onTaskMoved = ({ taskId, status, position, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useTaskStore.getState().moveTaskFromSocket(taskId, status, position);
    };

    const onTaskDeleted = ({ taskId, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useTaskStore.getState().removeTaskFromSocket(taskId);
    };

    // ─── Comment events ──────────────────────────────
    const onCommentCreated = ({ comment, taskId, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useCommentStore.getState().addCommentFromSocket(comment, taskId);
    };

    const onCommentUpdated = ({ comment, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useCommentStore.getState().updateCommentFromSocket(comment);
    };

    const onCommentDeleted = ({ commentId, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useCommentStore.getState().removeCommentFromSocket(commentId);
    };

    // ─── Notification events ─────────────────────────
    // Notifications should ALWAYS be received, even if we're the actor
    // (the actor might be notifying themselves indirectly)
    const onNotificationNew = ({ notification }) => {
      useNotificationStore.getState().addFromSocket(notification);
    };

    // ─── Activity events ─────────────────────────────
    const onActivityNew = ({ projectId, taskId }) => {
      if (taskId) useActivityStore.getState().invalidateTask(taskId);
      if (projectId) useActivityStore.getState().invalidateProject(projectId);
    };

    // ─── Attachment events ───────────────────────────
    const onAttachmentCreated = ({ attachment, taskId, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useAttachmentStore.getState().addAttachmentFromSocket(attachment, taskId);
    };

    const onAttachmentDeleted = ({ attachmentId, taskId, actorId }) => {
      if (actorId === getCurrentUserId()) return;
      useAttachmentStore.getState().removeAttachmentFromSocket(attachmentId, taskId);
    };

    socket.on('attachment:created', onAttachmentCreated);
    socket.on('attachment:deleted', onAttachmentDeleted);

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:moved', onTaskMoved);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('comment:created', onCommentCreated);
    socket.on('comment:updated', onCommentUpdated);
    socket.on('comment:deleted', onCommentDeleted);
    socket.on('notification:new', onNotificationNew);
    socket.on('activity:new', onActivityNew);

    return () => {
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:moved', onTaskMoved);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('comment:created', onCommentCreated);
      socket.off('comment:updated', onCommentUpdated);
      socket.off('comment:deleted', onCommentDeleted);
      socket.off('notification:new', onNotificationNew);
      socket.off('activity:new', onActivityNew);
      socket.off('attachment:created', onAttachmentCreated);
      socket.off('attachment:deleted', onAttachmentDeleted);
    };
  }, [socket]);
};