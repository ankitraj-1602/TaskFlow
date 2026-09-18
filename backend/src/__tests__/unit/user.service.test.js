// ─── Mock ALL external dependencies BEFORE requiring the service ───
jest.mock('../../db/queries/user.queries');
jest.mock('../../utils/password.utils');
jest.mock('../../utils/jwt.utils');
jest.mock('../../services/email.service');
jest.mock('../../utils/token.utils');
jest.mock('../../utils/cache.utils');
jest.mock('../../jobs/email.producer');

// ─── Now require the service (dependencies come back as mocks) ───
const UserService = require('../../services/user.service');
const UserQueries = require('../../db/queries/user.queries');
const { hashPassword, comparePassword } = require('../../utils/password.utils');
const {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiry,
} = require('../../utils/jwt.utils');
const {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
} = require('../../utils/token.utils');
const { invalidateCache, buildKey } = require('../../utils/cache.utils');
const EmailProducer = require('../../jobs/email.producer');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    // clearMocks: true in jest.config.js resets mocks between tests
  });

  // ═══════════════════════════════════════════════════
  // register()
  // ═══════════════════════════════════════════════════
  describe('register()', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'Test@123456',
      name: 'Test User',
    };

    // Helper: sets up all mocks for a successful registration
    const setupSuccessfulRegister = () => {
      UserQueries.findByEmail.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed-password');
      UserQueries.create.mockResolvedValue({
        id: 'new-user-id',
        email: validInput.email,
        name: validInput.name,
      });
      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');
      getTokenExpiry.mockReturnValue(new Date(Date.now() + 7 * 86400000));
      UserQueries.updateRefreshToken.mockResolvedValue();
      createEmailVerificationToken.mockResolvedValue('verify-token');
      EmailProducer.queueVerification.mockResolvedValue();
    };

    it('should throw if email already exists', async () => {
      UserQueries.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(userService.register(validInput))
        .rejects.toThrow('User with this email already exists');

      expect(UserQueries.create).not.toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      setupSuccessfulRegister();

      await userService.register(validInput);

      // Verify hashPassword was called with the plain password
      expect(hashPassword).toHaveBeenCalledWith('Test@123456');

      // Verify UserQueries.create was called with the hashed password
      expect(UserQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password_hash: 'hashed-password',
        })
      );
    });

    it('should return user and tokens', async () => {
      setupSuccessfulRegister();

      const result = await userService.register(validInput);

      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should queue a verification email with correct payload', async () => {
      setupSuccessfulRegister();

      await userService.register(validInput);

      expect(EmailProducer.queueVerification).toHaveBeenCalledWith({
        to: 'test@example.com',
        name: 'Test User',
        token: 'verify-token',
      });
    });

    it('should save the refresh token to the DB', async () => {
      setupSuccessfulRegister();

      await userService.register(validInput);

      expect(UserQueries.updateRefreshToken).toHaveBeenCalledWith(
        'new-user-id',
        'refresh-token',
        expect.any(Date)
      );
    });

    it('should still succeed if email queuing fails (non-fatal)', async () => {
      setupSuccessfulRegister();
      EmailProducer.queueVerification.mockRejectedValue(new Error('Queue down'));

      // Register should NOT throw
      const result = await userService.register(validInput);
      expect(result).toHaveProperty('tokens');
    });
  });

  // ═══════════════════════════════════════════════════
  // login()
  // ═══════════════════════════════════════════════════
  describe('login()', () => {
    const existingUser = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      password_hash: 'hashed-password',
    };

    it('should throw if user not found', async () => {
      UserQueries.findByEmail.mockResolvedValue(null);

      await expect(userService.login('test@example.com', 'Test@123456'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw if account is deactivated', async () => {
      UserQueries.findByEmail.mockResolvedValue({
        ...existingUser,
        deleted_at: new Date(),
      });

      await expect(userService.login('test@example.com', 'Test@123456'))
        .rejects.toThrow('Account has been deactivated');
    });

    it('should throw if password is wrong', async () => {
      UserQueries.findByEmail.mockResolvedValue(existingUser);
      comparePassword.mockResolvedValue(false);

      await expect(userService.login('test@example.com', 'WrongPassword'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should return user and tokens on success', async () => {
      UserQueries.findByEmail.mockResolvedValue(existingUser);
      comparePassword.mockResolvedValue(true);
      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');
      getTokenExpiry.mockReturnValue(new Date());
      UserQueries.updateLastLogin.mockResolvedValue();
      UserQueries.updateRefreshToken.mockResolvedValue();

      const result = await userService.login('test@example.com', 'Test@123456');

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
      // password_hash must NOT be exposed
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should update last_login_at on success', async () => {
      UserQueries.findByEmail.mockResolvedValue(existingUser);
      comparePassword.mockResolvedValue(true);
      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');
      getTokenExpiry.mockReturnValue(new Date());
      UserQueries.updateLastLogin.mockResolvedValue();
      UserQueries.updateRefreshToken.mockResolvedValue();

      await userService.login('test@example.com', 'Test@123456');

      expect(UserQueries.updateLastLogin).toHaveBeenCalledWith('user-id');
    });
  });

  // ═══════════════════════════════════════════════════
  // verifyEmail()
  // ═══════════════════════════════════════════════════
  describe('verifyEmail()', () => {
    it('should throw for invalid token', async () => {
      verifyEmailVerificationToken.mockResolvedValue(null);

      await expect(userService.verifyEmail('bad-token'))
        .rejects.toThrow('Invalid or expired verification token');
    });

    it('should return user early if already verified (idempotent)', async () => {
      verifyEmailVerificationToken.mockResolvedValue({ userId: 'user-id' });
      UserQueries.findById.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        is_email_verified: true,
      });

      const result = await userService.verifyEmail('valid-token');

      expect(result.is_email_verified).toBe(true);
      // Should NOT call verifyEmail query again
      expect(UserQueries.verifyEmail).not.toHaveBeenCalled();
    });

    it('should verify email and queue welcome email for unverified user', async () => {
      verifyEmailVerificationToken.mockResolvedValue({ userId: 'user-id' });
      UserQueries.findById.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        is_email_verified: false,
      });
      UserQueries.verifyEmail.mockResolvedValue();
      EmailProducer.queueWelcome.mockResolvedValue();

      const result = await userService.verifyEmail('valid-token');

      expect(UserQueries.verifyEmail).toHaveBeenCalledWith('user-id');
      expect(EmailProducer.queueWelcome).toHaveBeenCalledWith({
        to: 'test@example.com',
        name: 'Test User',
      });
      expect(result.is_email_verified).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // forgotPassword()
  // ═══════════════════════════════════════════════════
  describe('forgotPassword()', () => {
    it('should return generic message if user not found (no enumeration)', async () => {
      UserQueries.findByEmail.mockResolvedValue(null);

      const result = await userService.forgotPassword('nobody@example.com');

      expect(result.message).toBe(
        'If that email exists, a reset link has been sent.'
      );
      // Should NOT queue an email
      expect(EmailProducer.queuePasswordReset).not.toHaveBeenCalled();
    });

    it('should queue a reset email if user exists', async () => {
      UserQueries.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
      });
      createPasswordResetToken.mockResolvedValue('reset-token');
      EmailProducer.queuePasswordReset.mockResolvedValue();

      await userService.forgotPassword('test@example.com');

      expect(EmailProducer.queuePasswordReset).toHaveBeenCalledWith({
        to: 'test@example.com',
        name: 'Test User',
        token: 'reset-token',
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // changePassword()
  // ═══════════════════════════════════════════════════
  describe('changePassword()', () => {
    it('should throw if current password is wrong', async () => {
      UserQueries.findById.mockResolvedValue({
        id: 'user-id',
        password_hash: 'hashed-old',
      });
      comparePassword.mockResolvedValue(false);

      await expect(
        userService.changePassword('user-id', 'WrongOld', 'NewPass@123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should hash new password, clear refresh tokens, invalidate cache', async () => {
      UserQueries.findById.mockResolvedValue({
        id: 'user-id',
        password_hash: 'hashed-old',
      });
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('hashed-new');
      UserQueries.updatePassword.mockResolvedValue();
      UserQueries.clearRefreshToken.mockResolvedValue();
      invalidateCache.mockResolvedValue();
      buildKey.mockReturnValue('user:user-id:auth');

      const result = await userService.changePassword(
        'user-id',
        'OldPass@123',
        'NewPass@123'
      );

      expect(hashPassword).toHaveBeenCalledWith('NewPass@123');
      expect(UserQueries.updatePassword).toHaveBeenCalledWith(
        'user-id',
        'hashed-new'
      );
      expect(UserQueries.clearRefreshToken).toHaveBeenCalledWith('user-id');
      expect(invalidateCache).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});