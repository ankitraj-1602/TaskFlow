const router = require('express').Router();
const LabelController = require('../controllers/label.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireProjectAccess } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validation.middleware');
const Joi = require('joi');

// All routes require auth
router.use(authenticate);

// ─── Project-scoped label CRUD ───────────────────
router.post(
  '/projects/:projectId/labels',
  requireProjectAccess,
  validate(
    Joi.object({
      name: Joi.string().trim().min(1).max(50).required(),
      color: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .default('#6366f1'),
    })
  ),
  LabelController.create
);

router.get(
  '/projects/:projectId/labels',
  requireProjectAccess,
  LabelController.getByProject
);

// ─── Label update/delete ─────────────────────────
router.patch(
  '/labels/:id',
  validate(
    Joi.object({
      name: Joi.string().trim().min(1).max(50).optional(),
      color: Joi.string()
        .pattern(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    }).min(1)   // at least one field must be provided
  ),
  LabelController.update
);

router.delete('/labels/:id', LabelController.delete);

// ─── Task-label attach/detach ────────────────────
router.post('/tasks/:taskId/labels/:labelId', LabelController.attachToTask);
router.delete('/tasks/:taskId/labels/:labelId', LabelController.detachFromTask);

module.exports = router;