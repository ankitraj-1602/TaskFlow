const TaskService = require('../services/task.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response.utils');

const taskService = new TaskService();

class TaskController {
  static async createTask(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;
      const {
        title, description, status, priority, dueDate, storyPoints, assigneeId, metadata,
      } = req.body;

      const task = await taskService.createTask(projectId, userId, {
        title,
        description,
        status,
        priority,
        dueDate,
        storyPoints,
        assigneeId,
        metadata,
      });

      successResponse(res, task, 'Task created successfully', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getProjectTasks(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;
      const { status, priority, assigneeId, search, isArchived, dueBefore, dueAfter, sortBy, sortOrder, page, limit } = req.query;

      const filters = {};
      if (status) filters.status = status.split(',');
      if (priority) filters.priority = priority;
      if (assigneeId) filters.assigneeId = assigneeId;
      if (search) filters.search = search;
      if (isArchived !== undefined) filters.isArchived = isArchived === 'true';
      if (dueBefore) filters.dueBefore = dueBefore;
      if (dueAfter) filters.dueAfter = dueAfter;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;
      if (page) filters.page = page;
      if (limit) filters.limit = limit;

      const result = await taskService.getProjectTasks(projectId, userId, filters);

      if (filters.limit) {
        return paginatedResponse(
          res,
          result.data,
          result.total,
          result.page,
          result.limit,
          'Tasks retrieved successfully'
        );
      }

      successResponse(res, result, 'Tasks retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const task = await taskService.getTask(id, userId);

      successResponse(res, task, 'Task retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }

  static async updateTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const {
        title, description, status, priority, dueDate, storyPoints, assigneeId, metadata,
      } = req.body;

      const task = await taskService.updateTask(id, userId, {
        title,
        description,
        status,
        priority,
        dueDate,
        storyPoints,
        assigneeId,
        metadata,
      });

      successResponse(res, task, 'Task updated successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { status, position } = req.body;

      const task = await taskService.updateTaskStatus(id, userId, status, position);

      successResponse(res, task, 'Task status updated successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async reorderTasks(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;
      const { status, taskIds } = req.body;

      await taskService.reorderTasks(projectId, userId, status, taskIds);

      successResponse(res, null, 'Tasks reordered successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await taskService.deleteTask(id, userId);

      successResponse(res, null, 'Task deleted successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async archiveTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const task = await taskService.archiveTask(id, userId);

      successResponse(res, task, 'Task archived successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async unarchiveTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const task = await taskService.unarchiveTask(id, userId);

      successResponse(res, task, 'Task unarchived successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async duplicateTask(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const task = await taskService.duplicateTask(id, userId);

      successResponse(res, task, 'Task duplicated successfully', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getTaskStats(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;

      const stats = await taskService.getTaskStats(projectId, userId);

      successResponse(res, stats, 'Task statistics retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getMyTasks(req, res) {
    try {
      const userId = req.user.userId;
      const { status, projectId } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (projectId) filters.projectId = projectId;

      const tasks = await taskService.getMyTasks(userId, filters);

      successResponse(res, tasks, 'Tasks retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
}

module.exports = TaskController;