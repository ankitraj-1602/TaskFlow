const path = require('path');
const fs = require('fs');
const AttachmentService = require('../services/attachment.service');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { UPLOAD_DIR } = require('../config/upload');

const attachmentService = new AttachmentService();

class AttachmentController {
  static async upload(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.userId;

      if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const attachment = await attachmentService.uploadAttachment(
        taskId,
        userId,
        req.file
      );

      successResponse(res, attachment, 'File uploaded successfully', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getTaskAttachments(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.userId;

      const attachments = await attachmentService.getTaskAttachments(
        taskId,
        userId
      );

      successResponse(res, attachments, 'Attachments retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await attachmentService.deleteAttachment(id, userId);

      successResponse(res, null, 'Attachment deleted successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  /**
   * Serve a file. Publicly accessible if URL is known,
   * but URLs contain random UUIDs (unguessable).
   */
  static async serve(req, res) {
    try {
      const { year, month, filename } = req.params;

      // Validate format
      if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !filename) {
        return errorResponse(res, 'Invalid file path', 400);
      }

      // Build file path
      const filePath = path.join(UPLOAD_DIR, year, month, filename);

      // Security: ensure resolved path is inside UPLOAD_DIR
      const resolved = path.resolve(filePath);
      const base = path.resolve(UPLOAD_DIR);
      if (!resolved.startsWith(base)) {
        return errorResponse(res, 'Invalid file path', 400);
      }

      // Check file exists
      if (!fs.existsSync(filePath)) {
        return errorResponse(res, 'File not found', 404);
      }

      // Serve the file
      res.sendFile(filePath);
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
}

module.exports = AttachmentController;