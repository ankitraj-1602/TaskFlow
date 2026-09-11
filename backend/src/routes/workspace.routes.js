const router = require('express').Router();
const WorkspaceController = require('../controllers/workspace.controller');
const ProjectController = require('../controllers/project.controller');
const TaskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  requireWorkspaceMember,
  requireWorkspaceRole,
} = require('../middleware/rbac.middleware');
const Joi = require('joi');

// Validation schemas (unchanged)
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

// ═══════════════════════════════════════════════════
// All routes require authentication
// ═══════════════════════════════════════════════════
router.use(authenticate);

// ─── Workspace CRUD ─────────────────────────────────

// Create: any authenticated user
router.post('/', validate(createWorkspaceSchema), WorkspaceController.createWorkspace);

// List user's workspaces: any authenticated user
router.get('/', WorkspaceController.getUserWorkspaces);

// ⬇️ From this point, routes need workspace membership
// We use requireWorkspaceMember which reads :id from params

// Get specific workspace
router.get(
  '/:id',
  requireWorkspaceMember,
  WorkspaceController.getWorkspace
);

// Update workspace (ADMIN or OWNER)
router.patch(
  '/:id',
  requireWorkspaceMember,
  requireWorkspaceRole('ADMIN', 'OWNER'),
  validate(updateWorkspaceSchema),
  WorkspaceController.updateWorkspace
);

// Delete workspace (OWNER only)
router.delete(
  '/:id',
  requireWorkspaceMember,
  requireWorkspaceRole('OWNER'),
  WorkspaceController.deleteWorkspace
);

// ─── Member Management ──────────────────────────────

// Add member (ADMIN or OWNER)
router.post(
  '/:id/members',
  requireWorkspaceMember,
  requireWorkspaceRole('ADMIN', 'OWNER'),
  validate(addMemberSchema),
  WorkspaceController.addMember
);

// Get members (any member)
router.get(
  '/:id/members',
  requireWorkspaceMember,
  WorkspaceController.getWorkspaceMembers
);

// Remove member (ADMIN or OWNER)
router.delete(
  '/:id/members/:memberId',
  requireWorkspaceMember,
  requireWorkspaceRole('ADMIN', 'OWNER'),
  WorkspaceController.removeMember
);

// Update member role (OWNER only)
router.patch(
  '/:id/members/:memberId/role',
  requireWorkspaceMember,
  requireWorkspaceRole('OWNER'),
  validate(updateMemberRoleSchema),
  WorkspaceController.updateMemberRole
);

// ─── Projects within Workspace ──────────────────────

// Create project (MANAGER, ADMIN, OWNER)
router.post(
  '/:workspaceId/projects',
  requireWorkspaceMember,
  requireWorkspaceRole('MANAGER', 'ADMIN', 'OWNER'),
  validate(createProjectSchema),
  ProjectController.createProject
);

// List projects (any member)
router.get(
  '/:workspaceId/projects',
  requireWorkspaceMember,
  ProjectController.getWorkspaceProjects
);

// ─── Tasks within Project ───────────────────────────

// Create task (MEMBER, MANAGER, ADMIN, OWNER)
router.post(
  '/:workspaceId/projects/:projectId/tasks',
  requireWorkspaceMember,
  requireWorkspaceRole('MEMBER', 'MANAGER', 'ADMIN', 'OWNER'),
  validate(createTaskSchema),
  TaskController.createTask
);

// List tasks (any member including VIEWER)
router.get(
  '/:workspaceId/projects/:projectId/tasks',
  requireWorkspaceMember,
  TaskController.getProjectTasks
);

// Task stats (any member)
router.get(
  '/:workspaceId/projects/:projectId/tasks/stats',
  requireWorkspaceMember,
  TaskController.getTaskStats
);

// Pending invitations
router.get(
  '/:id/invitations',
  requireWorkspaceMember,
  requireWorkspaceRole('ADMIN', 'OWNER'),
  WorkspaceController.getPendingInvitations
);

router.delete(
  '/:id/invitations/:invitationId',
  requireWorkspaceMember,
  requireWorkspaceRole('ADMIN', 'OWNER'),
  WorkspaceController.cancelInvitation
);

module.exports = router;