const router = require('express').Router();
const ActivityController = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// Task activities
router.get('/tasks/:taskId/activities', ActivityController.getTaskActivities);

// Project activities
router.get('/projects/:id/activities', ActivityController.getProjectActivities);

// Workspace activities
router.get('/workspaces/:id/activities', ActivityController.getWorkspaceActivities);

module.exports = router;