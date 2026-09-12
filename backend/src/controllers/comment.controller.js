const CommentService = require('../services/comment.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const commentService = new CommentService();

class CommentController {
  static async createComment(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.userId;
      const { content, parentId } = req.body;

      const comment = await commentService.createComment(taskId, userId, {
        content,
        parentId,
      });

      successResponse(res, comment, 'Comment created successfully', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getTaskComments(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.userId;

      const comments = await commentService.getTaskComments(taskId, userId);
      successResponse(res, comments, 'Comments retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async updateComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { content } = req.body;

      const comment = await commentService.updateComment(id, userId, content);
      successResponse(res, comment, 'Comment updated successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await commentService.deleteComment(id, userId);
      successResponse(res, null, 'Comment deleted successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }
}

module.exports = CommentController;