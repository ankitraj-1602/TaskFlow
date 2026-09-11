const router = require('express').Router();
const TaskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  requireProjectAccess,
  requireProjectRole,
} = require('../middleware/rbac.middleware');
const Joi = require('joi');

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(5000).allow('').optional(),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED').optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  storyPoints: Joi.number().integer().min(0).max(100).allow(null).optional(),
  assigneeId: Joi.string().uuid().allow(null).optional(),
  metadata: Joi.object().optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED').required(),
  position: Joi.number().integer().min(0).optional(),
});

const reorderSchema = Joi.object({
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED').required(),
  taskIds: Joi.array().items(Joi.string().uuid()).required(),
});

router.use(authenticate);

// My tasks (any authenticated user)
router.get('/my-tasks', TaskController.getMyTasks);

// Get single task (any project member)
router.get(
  '/tasks/:id',
  TaskController.getTask
);

// Update task (MEMBER+)
router.patch(
  '/tasks/:id',
  validate(updateTaskSchema),
  TaskController.updateTask
);

// Update status (MEMBER+)
router.patch(
  '/tasks/:id/status',
  validate(updateStatusSchema),
  TaskController.updateTaskStatus
);

// Reorder tasks (MEMBER+)
router.post(
  '/projects/:projectId/tasks/reorder',
  requireProjectAccess,
  requireProjectRole('MEMBER', 'MANAGER', 'ADMIN', 'OWNER'),
  validate(reorderSchema),
  TaskController.reorderTasks
);

// Archive task (MANAGER+)
router.patch(
  '/tasks/:id/archive',
  TaskController.archiveTask
);

// Unarchive task (MANAGER+)
router.patch(
  '/tasks/:id/unarchive',
  TaskController.unarchiveTask
);

// Duplicate task (MEMBER+)
router.post(
  '/tasks/:id/duplicate',
  TaskController.duplicateTask
);

// Delete task (MANAGER+)
router.delete(
  '/tasks/:id',
  TaskController.deleteTask
);

module.exports = router;