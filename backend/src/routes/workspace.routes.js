const router = require('express').Router();
const WorkspaceController = require('../controllers/workspace.controller');
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

// All routes require authentication
router.use(authenticate);

// Workspace CRUD
router.post(
  '/',
  validate(createWorkspaceSchema),
  WorkspaceController.createWorkspace
);

router.get('/', WorkspaceController.getUserWorkspaces);

router.get('/:id', WorkspaceController.getWorkspace);

router.patch(
  '/:id',
  validate(updateWorkspaceSchema),
  WorkspaceController.updateWorkspace
);

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

module.exports = router;