const crypto = require('crypto');
const QueryHelper = require('../db/queries/helper');

/**
 * Generate a secure random token
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create an email verification token
 */
const createEmailVerificationToken = async (userId, expiryHours = 24) => {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await QueryHelper.query(
    `INSERT INTO email_verification_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  );

  return token;
};

/**
 * Verify an email verification token
 * Returns { userId, valid } or throws
 */
const verifyEmailVerificationToken = async (token) => {
  const result = await QueryHelper.query(
    `SELECT * FROM email_verification_tokens 
     WHERE token = $1 
     AND expires_at > CURRENT_TIMESTAMP 
     AND used_at IS NULL`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const tokenRecord = result.rows[0];

  // Mark as used
  await QueryHelper.query(
    `UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [tokenRecord.id]
  );

  return { userId: tokenRecord.user_id };
};

/**
 * Create a password reset token
 */
const createPasswordResetToken = async (userId, expiryHours = 1) => {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  // Invalidate any existing unused tokens for this user
  await QueryHelper.query(
    `UPDATE password_reset_tokens 
     SET used_at = CURRENT_TIMESTAMP 
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );

  await QueryHelper.query(
    `INSERT INTO password_reset_tokens (token, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  );

  return token;
};

/**
 * Verify a password reset token
 */
const verifyPasswordResetToken = async (token) => {
  const result = await QueryHelper.query(
    `SELECT * FROM password_reset_tokens 
     WHERE token = $1 
     AND expires_at > CURRENT_TIMESTAMP 
     AND used_at IS NULL`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return { userId: result.rows[0].user_id, tokenId: result.rows[0].id };
};

/**
 * Mark a password reset token as used
 */
const markPasswordResetTokenUsed = async (tokenId) => {
  await QueryHelper.query(
    `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [tokenId]
  );
};

/**
 * Clean up expired tokens (call periodically)
 */
const cleanupExpiredTokens = async () => {
  await QueryHelper.query(
    `DELETE FROM email_verification_tokens WHERE expires_at < CURRENT_TIMESTAMP`
  );
  await QueryHelper.query(
    `DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP`
  );
  console.log('🧹 Cleaned up expired tokens');
};
const createWorkspaceInvitationToken = async (invitationData) => {
  const InvitationQueries = require('../db/queries/invitation.queries');
  
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await InvitationQueries.create({
    token,
    email: invitationData.email,
    role: invitationData.role,
    workspaceId: invitationData.workspaceId,
    invitedBy: invitationData.invitedBy,
    expiresAt,
  });

  return { token, invitation };
};

module.exports = {
  generateSecureToken,
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
  cleanupExpiredTokens,
  createWorkspaceInvitationToken,  
};