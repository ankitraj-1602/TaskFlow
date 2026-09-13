import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocketStore } from '../store/socket.store';
import { useTaskStore } from '../store/task.store';
import { useCommentStore } from '../store/comment.store';
import { useActivityStore } from '../store/activity.store';
import { useNotificationStore } from '../store/notification.store';

export const useSocketEvents = () => {
  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    // ─── Task events ─────────────────────────────────
    const onTaskCreated = ({ task, actorId }) => {
      useTaskStore.getState().addTaskFromSocket(task);
    };

    const onTaskUpdated = ({ task, actorId }) => {
      useTaskStore.getState().updateTaskFromSocket(task);
    };

    const onTaskMoved = ({ taskId, status, position }) => {
      useTaskStore.getState().moveTaskFromSocket(taskId, status, position);
    };

    const onTaskDeleted = ({ taskId }) => {
      useTaskStore.getState().removeTaskFromSocket(taskId);
    };

    // ─── Comment events ──────────────────────────────
    const onCommentCreated = ({ comment, taskId }) => {
      useCommentStore.getState().addCommentFromSocket(comment, taskId);
    };

    const onCommentUpdated = ({ comment }) => {
      useCommentStore.getState().updateCommentFromSocket(comment);
    };

    const onCommentDeleted = ({ commentId }) => {
      useCommentStore.getState().removeCommentFromSocket(commentId);
    };

    // ─── Notification events ─────────────────────────
    const onNotificationNew = ({ notification }) => {
      useNotificationStore.getState().addFromSocket(notification);
    };

    // ─── Activity events ─────────────────────────────
    const onActivityNew = ({ activity, projectId, taskId }) => {
      if (taskId) useActivityStore.getState().invalidateTask(taskId);
      if (projectId) useActivityStore.getState().invalidateProject(projectId);
    };

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
    };
  }, [socket]);
};