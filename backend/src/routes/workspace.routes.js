const router = require('express').Router();
const WorkspaceController = require('../controllers/workspace.controller');
const ProjectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const Joi = require('joi');

// Validation schemas
const createWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
});

const updateWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  logo: Joi.string().uri().optional(),
  settings: Joi.object().optional(),
});

const addMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER').default('MEMBER'),
});

const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER').required(),
});

const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED').optional(),
  startDate: Joi.date().iso().optional(),
  dueDate: Joi.date().iso().optional(),
});

// All routes require authentication
router.use(authenticate);

// Workspace CRUD
router.post('/', validate(createWorkspaceSchema), WorkspaceController.createWorkspace);
router.get('/', WorkspaceController.getUserWorkspaces);
router.get('/:id', WorkspaceController.getWorkspace);
router.patch('/:id', validate(updateWorkspaceSchema), WorkspaceController.updateWorkspace);
router.delete('/:id', WorkspaceController.deleteWorkspace);

// Member management
router.post('/:id/members', validate(addMemberSchema), WorkspaceController.addMember);
router.get('/:id/members', WorkspaceController.getWorkspaceMembers);
router.delete('/:id/members/:memberId', WorkspaceController.removeMember);
router.patch(
  '/:id/members/:memberId/role',
  validate(updateMemberRoleSchema),
  WorkspaceController.updateMemberRole
);

// Projects within workspace
router.post(
  '/:workspaceId/projects',
  validate(createProjectSchema),
  ProjectController.createProject
);
router.get('/:workspaceId/projects', ProjectController.getWorkspaceProjects);


// Tasks within project (nested in workspace)
const TaskController = require('../controllers/task.controller');
const taskValidationSchemas = {
  createTask: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(5000).optional(),
    status: Joi.string().valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED').optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
    dueDate: Joi.date().iso().allow(null).optional(),
    storyPoints: Joi.number().integer().min(0).max(100).allow(null).optional(),
    assigneeId: Joi.string().uuid().allow(null).optional(),
    metadata: Joi.object().optional(),
  }),
};

router.post(
  '/:workspaceId/projects/:projectId/tasks',
  validate(taskValidationSchemas.createTask),
  TaskController.createTask
);

router.get(
  '/:workspaceId/projects/:projectId/tasks',
  TaskController.getProjectTasks
);

router.get(
  '/:workspaceId/projects/:projectId/tasks/stats',
  TaskController.getTaskStats
);

module.exports = router;