const router = require('express').Router();
const multer = require('multer');
const AttachmentController = require('../controllers/attachment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

// ─── Public: Serve files (URLs contain random UUIDs) ───
router.get('/uploads/:year/:month/:filename', AttachmentController.serve);

// ─── Authenticated routes ────────────────────────────
router.use(authenticate);

// Upload single file to a task
router.post(
  '/tasks/:taskId/attachments',
  upload.single('file'),
  AttachmentController.upload
);

// List attachments for a task
router.get(
  '/tasks/:taskId/attachments',
  AttachmentController.getTaskAttachments
);

// Delete an attachment
router.delete('/attachments/:id', AttachmentController.delete);

// Multer error handling — wrap it as a middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Max 10MB.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Max 5.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.code}`,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
});

module.exports = router;