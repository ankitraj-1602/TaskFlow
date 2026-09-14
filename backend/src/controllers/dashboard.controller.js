const DashboardService = require('../services/dashboard.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const dashboardService = new DashboardService();

class DashboardController {
  static async getStats(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;

      const stats = await dashboardService.getWorkspaceStats(workspaceId, userId);
      successResponse(res, stats, 'Dashboard stats retrieved');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getTrends(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;
      const days = parseInt(req.query.days) || 30;

      const trends = await dashboardService.getTaskTrends(
        workspaceId,
        userId,
        days
      );
      successResponse(res, trends, 'Task trends retrieved');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getTeamProductivity(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;

      const productivity = await dashboardService.getTeamProductivity(
        workspaceId,
        userId
      );
      successResponse(res, productivity, 'Team productivity retrieved');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getProjectProgress(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;

      const progress = await dashboardService.getProjectProgress(
        workspaceId,
        userId
      );
      successResponse(res, progress, 'Project progress retrieved');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getOverdueBreakdown(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;

      const breakdown = await dashboardService.getOverdueBreakdown(
        workspaceId,
        userId
      );
      successResponse(res, breakdown, 'Overdue breakdown retrieved');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }
}

module.exports = DashboardController;