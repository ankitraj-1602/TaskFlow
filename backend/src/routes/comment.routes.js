const router = require('express').Router();
const CommentController = require('../controllers/comment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const Joi = require('joi');

const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
  parentId: Joi.string().uuid().allow(null).optional(),
});

const updateCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});

router.use(authenticate);

// Comments under a task
router.post(
  '/tasks/:taskId/comments',
  validate(createCommentSchema),
  CommentController.createComment
);

router.get('/tasks/:taskId/comments', CommentController.getTaskComments);

// Single comment
router.patch(
  '/comments/:id',
  validate(updateCommentSchema),
  CommentController.updateComment
);

router.delete('/comments/:id', CommentController.deleteComment);

module.exports = router;