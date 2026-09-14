const router = require('express').Router();
const DashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  requireWorkspaceMember,
} = require('../middleware/rbac.middleware');

// All routes require authentication
router.use(authenticate);

// Workspace dashboard — requires workspace membership
router.get(
  '/workspaces/:workspaceId/dashboard',
  requireWorkspaceMember,
  DashboardController.getStats
);

router.get(
  '/workspaces/:workspaceId/dashboard/trends',
  requireWorkspaceMember,
  DashboardController.getTrends
);

router.get(
  '/workspaces/:workspaceId/dashboard/team',
  requireWorkspaceMember,
  DashboardController.getTeamProductivity
);

router.get(
  '/workspaces/:workspaceId/dashboard/projects',
  requireWorkspaceMember,
  DashboardController.getProjectProgress
);

router.get(
  '/workspaces/:workspaceId/dashboard/overdue',
  requireWorkspaceMember,
  DashboardController.getOverdueBreakdown
);

module.exports = router;