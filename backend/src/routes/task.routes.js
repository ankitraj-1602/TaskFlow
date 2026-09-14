const router = require('express').Router();
const TaskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  requireProjectAccess,
  requireProjectRole,
} = require('../middleware/rbac.middleware');
const Joi = require('joi');

// ─── Validation Schemas ─────────────────────────────
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(5000).optional(),
  status: Joi.string().valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED').optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  storyPoints: Joi.number().integer().min(0).max(100).allow(null).optional(),
  assigneeId: Joi.string().uuid().allow(null).optional(),
  metadata: Joi.object().optional(),
});

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
  taskIds: Joi.array().items(Joi.string().uuid()).required().min(1),
});

// All routes require authentication
router.use(authenticate);

// ─── My tasks ───────────────────────────────────────
router.get('/my-tasks', TaskController.getMyTasks);

// ─── Reorder (must be BEFORE the /tasks generic patterns) ─
router.post(
  '/projects/:projectId/tasks/reorder',
  requireProjectAccess,
  requireProjectRole('MEMBER', 'MANAGER', 'ADMIN', 'OWNER'),
  validate(reorderSchema),
  TaskController.reorderTasks
);

// ─── Tasks within project ───────────────────────────
router.post(
  '/projects/:projectId/tasks',
  requireProjectAccess,
  requireProjectRole('MEMBER', 'MANAGER', 'ADMIN', 'OWNER'),
  validate(createTaskSchema),
  TaskController.createTask
);

router.get(
  '/projects/:projectId/tasks',
  requireProjectAccess,
  TaskController.getProjectTasks
);

router.get(
  '/projects/:projectId/tasks/stats',
  requireProjectAccess,
  TaskController.getTaskStats
);

// ─── Individual task ────────────────────────────────
router.get('/tasks/:id', TaskController.getTask);
router.patch('/tasks/:id', validate(updateTaskSchema), TaskController.updateTask);
router.patch('/tasks/:id/status', validate(updateStatusSchema), TaskController.updateTaskStatus);
router.patch('/tasks/:id/archive', TaskController.archiveTask);
router.patch('/tasks/:id/unarchive', TaskController.unarchiveTask);
router.post('/tasks/:id/duplicate', TaskController.duplicateTask);
router.delete('/tasks/:id', TaskController.deleteTask);

module.exports = router;