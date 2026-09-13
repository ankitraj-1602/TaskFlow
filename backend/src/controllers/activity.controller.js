const ActivityService = require('../services/activity.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const activityService = new ActivityService();

class ActivityController {
  static async getTaskActivities(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.userId;
      const { action, limit, page } = req.query;

      const activities = await activityService.getTaskActivities(taskId, userId, {
        action,
        limit,
        page,
      });

      successResponse(res, activities, 'Activities retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getProjectActivities(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { action, userId: actorId, limit, page } = req.query;

      const activities = await activityService.getProjectActivities(id, userId, {
        action,
        userId: actorId,
        limit,
        page,
      });

      successResponse(res, activities, 'Activities retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getWorkspaceActivities(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { action, userId: actorId, limit, page } = req.query;

      const activities = await activityService.getWorkspaceActivities(
        id,
        userId,
        { action, userId: actorId, limit, page }
      );

      successResponse(res, activities, 'Activities retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }
}

module.exports = ActivityController;