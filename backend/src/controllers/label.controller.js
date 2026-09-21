const LabelService = require('../services/label.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const labelService = new LabelService();

class LabelController {
  static async create(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;
      const label = await labelService.createLabel(projectId, userId, req.body);
      successResponse(res, label, 'Label created', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getByProject(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.userId;
      const labels = await labelService.getProjectLabels(projectId, userId);
      successResponse(res, labels, 'Labels retrieved');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const label = await labelService.updateLabel(id, userId, req.body);
      successResponse(res, label, 'Label updated');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      await labelService.deleteLabel(id, userId);
      successResponse(res, null, 'Label deleted');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async attachToTask(req, res) {
    try {
      const { taskId, labelId } = req.params;
      const userId = req.user.userId;
      await labelService.attachLabel(taskId, labelId, userId);
      successResponse(res, null, 'Label attached to task');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async detachFromTask(req, res) {
    try {
      const { taskId, labelId } = req.params;
      const userId = req.user.userId;
      await labelService.detachLabel(taskId, labelId, userId);
      successResponse(res, null, 'Label detached from task');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
}

module.exports = LabelController;