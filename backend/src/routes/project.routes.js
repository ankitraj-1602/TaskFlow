const router = require('express').Router({ mergeParams: true });
const ProjectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const Joi = require('joi');

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED').optional(),
  startDate: Joi.date().iso().optional(),
  dueDate: Joi.date().iso().optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED').optional(),
  startDate: Joi.date().iso().allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  ownerId: Joi.string().uuid().optional(),
  settings: Joi.object().optional(),
});

const addMemberSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  role: Joi.string().valid('MANAGER', 'MEMBER', 'VIEWER').default('MEMBER'),
});

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.post(
  '/',
  validate(createProjectSchema),
  ProjectController.createProject
);

router.get('/', ProjectController.getWorkspaceProjects);

router.get('/:id', ProjectController.getProject);

router.patch(
  '/:id',
  validate(updateProjectSchema),
  ProjectController.updateProject
);

router.delete('/:id', ProjectController.deleteProject);

// Archive/Unarchive
router.patch('/:id/archive', ProjectController.archiveProject);
router.patch('/:id/unarchive', ProjectController.unarchiveProject);

// Member management
router.get('/:id/members', ProjectController.getProjectMembers);

router.post(
  '/:id/members',
  validate(addMemberSchema),
  ProjectController.addProjectMember
);

router.delete('/:id/members/:memberId', ProjectController.removeProjectMember);

module.exports = router;