const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { authRateLimiter } = require('../middleware/rateLimit.middleware');
const Joi = require("joi")
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/user.validator');

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  AuthController.login
);

router.post('/refresh-token', AuthController.refreshToken);

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

router.post(
  '/verify-email',
  validate(Joi.object({
    token: Joi.string().required(),
  })),
  AuthController.verifyEmail
);

// Protected routes
router.use(authenticate);

router.post('/logout', AuthController.logout);
router.post('/logout-all', AuthController.logoutAllDevices);
router.get('/profile', AuthController.getProfile);
router.patch(
  '/profile',
  validate(updateProfileSchema),
  AuthController.updateProfile
);
router.patch(
  '/change-password',
  validate(changePasswordSchema),
  AuthController.changePassword
);

router.post('/send-verification', AuthController.sendVerificationEmail);
router.delete('/account', AuthController.deleteAccount);

module.exports = router;