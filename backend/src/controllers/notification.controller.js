const NotificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const notificationService = new NotificationService();

class NotificationController {
  static async getMyNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { unreadOnly, type, limit, page } = req.query;

      const notifications = await notificationService.getUserNotifications(
        userId,
        {
          unreadOnly: unreadOnly === 'true',
          type,
          limit: limit || 30,
          page: page || 1,
        }
      );

      successResponse(res, notifications, 'Notifications retrieved');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const count = await notificationService.getUnreadCount(userId);

      successResponse(res, { count }, 'Unread count retrieved');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }

  static async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const result = await notificationService.markAsRead(id, userId);
      successResponse(res, result, 'Notification marked as read');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const count = await notificationService.markAllAsRead(userId);

      successResponse(res, { count }, 'All notifications marked as read');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }

  static async deleteNotification(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);
      successResponse(res, null, 'Notification deleted');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async clearAll(req, res) {
    try {
      const userId = req.user.userId;
      const count = await notificationService.clearAll(userId);

      successResponse(res, { count }, 'All notifications cleared');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
}

module.exports = NotificationController;