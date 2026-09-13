const NotificationQueries = require('../db/queries/notification.queries');

class NotificationService {
  /**
   * Create a notification. Fire-and-forget — never breaks the main flow.
   */
  async create(data) {
    try {
      return await NotificationQueries.create(data);
    } catch (error) {
      console.error('⚠️ Notification creation failed:', error.message);
      return null;
    }
  }

  /**
   * Convenience: notify user that they were assigned to a task.
   */
  async notifyTaskAssigned({ userId, actorId, taskId, taskTitle, projectId }) {
    if (userId === actorId) return null; // Don't notify self

    return this.create({
      type: 'TASK_ASSIGNED',
      content: `You were assigned to "${taskTitle}"`,
      data: { taskId, projectId, taskTitle },
      userId,
      actorId,
    });
  }

  /**
   * Notify user they were mentioned in a comment.
   */
  async notifyMention({ userId, actorId, taskId, taskTitle, commentId, projectId }) {
    if (userId === actorId) return null;

    return this.create({
      type: 'TASK_MENTIONED',
      content: `You were mentioned in a comment on "${taskTitle}"`,
      data: { taskId, commentId, projectId, taskTitle },
      userId,
      actorId,
    });
  }

  /**
   * Notify task reporter/assignee about a new comment.
   */
  async notifyComment({ userId, actorId, taskId, taskTitle, commentId, projectId }) {
    if (userId === actorId) return null;

    return this.create({
      type: 'COMMENT_ADDED',
      content: `New comment on "${taskTitle}"`,
      data: { taskId, commentId, projectId, taskTitle },
      userId,
      actorId,
    });
  }

  /**
   * Notify about status change.
   */
  async notifyStatusChanged({ userId, actorId, taskId, taskTitle, from, to, projectId }) {
    if (userId === actorId) return null;

    const label = to === 'DONE' ? 'completed' : 'updated';
    return this.create({
      type: to === 'DONE' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
      content: `"${taskTitle}" was ${label} (${from} → ${to})`,
      data: { taskId, projectId, taskTitle, from, to },
      userId,
      actorId,
    });
  }

  /**
   * Notify about workspace invitation.
   */
  async notifyWorkspaceInvitation({ userId, actorId, workspaceId, workspaceName }) {
    return this.create({
      type: 'WORKSPACE_INVITATION',
      content: `You were invited to join "${workspaceName}"`,
      data: { workspaceId, workspaceName },
      userId,
      actorId,
    });
  }

  /**
   * Fetch user's notifications.
   */
  async getUserNotifications(userId, filters = {}) {
    const notifications = await NotificationQueries.findByUser(userId, filters);
    return notifications.map(this.enrichNotification);
  }

  async getUnreadCount(userId) {
    return NotificationQueries.countUnread(userId);
  }

  async markAsRead(notificationId, userId) {
    const updated = await NotificationQueries.markAsRead(notificationId, userId);
    if (!updated) throw new Error('Notification not found');
    return updated;
  }

  async markAllAsRead(userId) {
    const count = await NotificationQueries.markAllAsRead(userId);
    return count;
  }

  async deleteNotification(notificationId, userId) {
    const deleted = await NotificationQueries.delete(notificationId, userId);
    if (!deleted) throw new Error('Notification not found');
    return true;
  }

  async clearAll(userId) {
    return NotificationQueries.deleteAllForUser(userId);
  }

  // ─── Helpers ───────────────────────────────────────
  enrichNotification(row) {
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      data: row.data,
      isRead: row.is_read,
      readAt: row.read_at,
      userId: row.user_id,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actorEmail: row.actor_email,
      actorPicture: row.actor_picture,
      createdAt: row.created_at,
    };
  }
}

module.exports = NotificationService;