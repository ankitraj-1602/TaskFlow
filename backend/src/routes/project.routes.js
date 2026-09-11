const router = require('express').Router();
const ProjectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  requireProjectAccess,
  requireProjectRole,
} = require('../middleware/rbac.middleware');
const Joi = require('joi');

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

router.use(authenticate);

// ─── Get project (any member) ───────────────────────
router.get(
  '/:id',
  requireProjectAccess,
  ProjectController.getProject
);

// ─── Update project (MANAGER, ADMIN, OWNER) ─────────
router.patch(
  '/:id',
  requireProjectAccess,
  requireProjectRole('MANAGER', 'ADMIN', 'OWNER'),
  validate(updateProjectSchema),
  ProjectController.updateProject
);

// ─── Delete project (ADMIN, OWNER) ──────────────────
router.delete(
  '/:id',
  requireProjectAccess,
  requireProjectRole('ADMIN', 'OWNER'),
  ProjectController.deleteProject
);

// ─── Archive/unarchive (MANAGER, ADMIN, OWNER) ──────
router.patch(
  '/:id/archive',
  requireProjectAccess,
  requireProjectRole('MANAGER', 'ADMIN', 'OWNER'),
  ProjectController.archiveProject
);

router.patch(
  '/:id/unarchive',
  requireProjectAccess,
  requireProjectRole('MANAGER', 'ADMIN', 'OWNER'),
  ProjectController.unarchiveProject
);

// ─── Member management ──────────────────────────────

// Get members (any)
router.get(
  '/:id/members',
  requireProjectAccess,
  ProjectController.getProjectMembers
);

// Add member (MANAGER, ADMIN, OWNER)
router.post(
  '/:id/members',
  requireProjectAccess,
  requireProjectRole('MANAGER', 'ADMIN', 'OWNER'),
  validate(addMemberSchema),
  ProjectController.addProjectMember
);

// Remove member (ADMIN, OWNER)
router.delete(
  '/:id/members/:memberId',
  requireProjectAccess,
  requireProjectRole('ADMIN', 'OWNER'),
  ProjectController.removeProjectMember
);

module.exports = router;