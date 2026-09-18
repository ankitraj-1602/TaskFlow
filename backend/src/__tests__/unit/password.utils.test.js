const {
  hashPassword,
  comparePassword,
  isPasswordStrong,
} = require('../../utils/password.utils');

describe('password.utils', () => {
  // ─── hashPassword ──────────────────────────────
  describe('hashPassword()', () => {
    it('should return a hash string (not the plain password)', async () => {
      const hash = await hashPassword('Test@123456');
      expect(hash).not.toBe('Test@123456');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce a different hash each time (salt)', async () => {
      const h1 = await hashPassword('Test@123456');
      const h2 = await hashPassword('Test@123456');
      expect(h1).not.toBe(h2);
    });
  });

  // ─── comparePassword ───────────────────────────
  describe('comparePassword()', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword('Test@123456');
      const result = await comparePassword('Test@123456', hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const hash = await hashPassword('Test@123456');
      const result = await comparePassword('WrongPassword', hash);
      expect(result).toBe(false);
    });
  });

  // ─── isPasswordStrong ──────────────────────────
  describe('isPasswordStrong()', () => {
    it('should return true for a strong password', () => {
      expect(isPasswordStrong('Test@123456')).toBe(true);
    });

    it('should return false for short passwords', () => {
      expect(isPasswordStrong('Te@1')).toBe(false);
    });

    it('should return false for missing uppercase', () => {
      expect(isPasswordStrong('test@123456')).toBe(false);
    });

    it('should return false for missing lowercase', () => {
      expect(isPasswordStrong('TEST@123456')).toBe(false);
    });

    it('should return false for missing number', () => {
      expect(isPasswordStrong('Test@abcde')).toBe(false);
    });

    it('should return false for missing special character', () => {
      expect(isPasswordStrong('Test123456')).toBe(false);
    });
  });
});