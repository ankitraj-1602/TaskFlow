const router = require('express').Router();
const WorkspaceController = require('../controllers/workspace.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public — get invitation details
router.get('/:token', WorkspaceController.getInvitationDetails);

// Protected — accept invitation
router.post('/:token/accept', authenticate, WorkspaceController.acceptInvitation);

module.exports = router;