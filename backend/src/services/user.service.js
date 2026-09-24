// const UserQueries = require('../db/queries/user.queries');
// const { hashPassword, comparePassword } = require('../utils/password.utils');
// const {
//   generateAccessToken,
//   generateRefreshToken,
//   getTokenExpiry,
//   verifyAccessToken,
//   verifyRefreshToken,
// } = require('../utils/jwt.utils');
// const emailService = require('./email.service');
// const {
//   createEmailVerificationToken,
//   verifyEmailVerificationToken,
//   createPasswordResetToken,
//   verifyPasswordResetToken,
//   markPasswordResetTokenUsed,
// } = require('../utils/token.utils');
// const { invalidateCache, buildKey } = require('../utils/cache.utils');   // ⬅️ FIXED import
// const EmailProducer = require('../jobs/email.producer');
// const logger = require('../config/logger');

// class UserService {
//   async register(userData) {
//     const { email, password, name, jobTitle, timezone } = userData;

//     const existingUser = await UserQueries.findByEmail(email);
//     if (existingUser) {
//       throw new Error('User with this email already exists');
//     }

//     const hashedPassword = await hashPassword(password);

//     const user = await UserQueries.create({
//       email,
//       password_hash: hashedPassword,
//       name,
//       job_title: jobTitle,
//       timezone: timezone || 'UTC',
//     });

//     const accessToken = generateAccessToken({
//       userId: user.id,
//       email: user.email,
//     });

//     const refreshToken = generateRefreshToken({
//       userId: user.id,
//       email: user.email,
//     });

//     const tokenExpiry = getTokenExpiry(refreshToken);
//     await UserQueries.updateRefreshToken(user.id, refreshToken, tokenExpiry);

//     try {
//       const verificationToken = await createEmailVerificationToken(user.id, 24);
//       // await emailService.sendVerificationEmail({
//       //   to: user.email,
//       //   name: user.name,
//       //   token: verificationToken,
//       // });
//       await EmailProducer.queueVerification({
//         to: user.email,
//         name: user.name,
//         token: verificationToken,
//       });
//     } catch (emailError) {
//      logger.error('Failed to send verification email', {
//         email: user.email,
//         userId: user.id,
//         error: emailError.message,
//       });
//     }

//     return {
//       user,
//       tokens: { accessToken, refreshToken },
//     };
//   }

//   async login(email, password) {
//     const user = await UserQueries.findByEmail(email);
//     if (!user) throw new Error('Invalid email or password');
//     if (user.deleted_at) throw new Error('Account has been deactivated');

//     const isPasswordValid = await comparePassword(password, user.password_hash);
//     if (!isPasswordValid) throw new Error('Invalid email or password');

//     await UserQueries.updateLastLogin(user.id);

//     const accessToken = generateAccessToken({
//       userId: user.id,
//       email: user.email,
//     });

//     const refreshToken = generateRefreshToken({
//       userId: user.id,
//       email: user.email,
//     });

//     const tokenExpiry = getTokenExpiry(refreshToken);
//     await UserQueries.updateRefreshToken(user.id, refreshToken, tokenExpiry);

//     const { password_hash, refresh_token, refresh_token_expiry, ...userWithoutSensitive } = user;

//     return {
//       user: userWithoutSensitive,
//       tokens: { accessToken, refreshToken },
//     };
//   }

//   async refreshToken(refreshToken) {
//     const decoded = verifyRefreshToken(refreshToken);
//     if (!decoded) throw new Error('Invalid refresh token');

//     const user = await UserQueries.findByRefreshToken(refreshToken);
//     if (!user) throw new Error('Invalid refresh token');

//     const newAccessToken = generateAccessToken({
//       userId: user.id,
//       email: user.email,
//     });

//     const newRefreshToken = generateRefreshToken({
//       userId: user.id,
//       email: user.email,
//     });

//     const tokenExpiry = getTokenExpiry(newRefreshToken);
//     await UserQueries.updateRefreshToken(user.id, newRefreshToken, tokenExpiry);

//     return {
//       accessToken: newAccessToken,
//       refreshToken: newRefreshToken,
//     };
//   }

//   async logout(userId) {
//     await UserQueries.clearRefreshToken(userId);
//     return true;
//   }

//   async logoutAllDevices(userId) {
//     await UserQueries.clearRefreshToken(userId);
//     return true;
//   }

//   async getUserProfile(userId) {
//     const user = await UserQueries.findById(userId);
//     if (!user) throw new Error('User not found');

//     const { password_hash, refresh_token, refresh_token_expiry, ...userProfile } = user;
//     return userProfile;
//   }

//   async updateProfile(userId, updateData) {
//     const user = await UserQueries.update(userId, {
//       name: updateData.name,
//       bio: updateData.bio,
//       job_title: updateData.jobTitle,
//       timezone: updateData.timezone,
//       profile_picture: updateData.profilePicture,
//     });

//     if (!user) throw new Error('User not found');

//     await invalidateCache(buildKey('user', userId, 'auth'));
//     return user;
//   }

//   async changePassword(userId, currentPassword, newPassword) {
//     const user = await UserQueries.findById(userId);
//     if (!user) throw new Error('User not found');

//     const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
//     if (!isPasswordValid) throw new Error('Current password is incorrect');

//     const hashedPassword = await hashPassword(newPassword);
//     await UserQueries.updatePassword(userId, hashedPassword);

//     await UserQueries.clearRefreshToken(userId);
//     await invalidateCache(buildKey('user', userId, 'auth'));

//     return true;
//   }

//   async sendVerificationEmail(userId) {
//     const user = await UserQueries.findById(userId);
//     if (!user) throw new Error('User not found');
//     if (user.is_email_verified) throw new Error('Email is already verified');

//     const verificationToken = await createEmailVerificationToken(userId, 24);
//     // await emailService.sendVerificationEmail({
//     //   to: user.email,
//     //   name: user.name,
//     //   token: verificationToken,
//     // });
//     await EmailProducer.queueVerification({
//       to: user.email,
//       name: user.name,
//       token: verificationToken,
//     });

//     return true;
//   }

//   // ⬇️ Only ONE verifyEmail method now (the duplicate is removed)
//   async verifyEmail(token) {
//     const result = await verifyEmailVerificationToken(token);
//     if (!result) throw new Error('Invalid or expired verification token');

//     const user = await UserQueries.findById(result.userId);
//     if (!user) throw new Error('User not found');
//     if (user.is_email_verified) return user;

//     await UserQueries.verifyEmail(result.userId);

//     try {
//       // await emailService.sendWelcomeEmail({
//       //   to: user.email,
//       //   name: user.name,
//       // });
//       await EmailProducer.queueWelcome({
//         to: user.email,
//         name: user.name,
//       });
//     } catch (emailError) {
//       logger.error('Failed to send welcome email', {
//         userId: user.id,
//         error: emailError.message,
//       });
//     }

//     return { ...user, is_email_verified: true };
//   }

//   async forgotPassword(email) {
//     const user = await UserQueries.findByEmail(email);
//     if (!user) {
//       return { message: 'If that email exists, a reset link has been sent.' };
//     }

//     const resetToken = await createPasswordResetToken(user.id, 1);
//     // await emailService.sendPasswordResetEmail({
//     //   to: user.email,
//     //   name: user.name,
//     //   token: resetToken,
//     // });
//     await EmailProducer.queuePasswordReset({
//       to: user.email,
//       name: user.name,
//       token: resetToken,
//     });

//     return { message: 'If that email exists, a reset link has been sent.' };
//   }

//   async resetPassword(token, newPassword) {
//     const result = await verifyPasswordResetToken(token);
//     if (!result) throw new Error('Invalid or expired reset token');

//     const hashedPassword = await hashPassword(newPassword);
//     await UserQueries.updatePassword(result.userId, hashedPassword);

//     await markPasswordResetTokenUsed(result.tokenId);
//     await UserQueries.clearRefreshToken(result.userId);

//     return true;
//   }

//   async deleteAccount(userId, password) {
//     const user = await UserQueries.findById(userId);
//     if (!user) throw new Error('User not found');

//     const isPasswordValid = await comparePassword(password, user.password_hash);
//     if (!isPasswordValid) throw new Error('Password is incorrect');

//     await UserQueries.clearRefreshToken(userId);

//     const QueryHelper = require('../db/queries/helper');
//     await QueryHelper.query(
//       `UPDATE users 
//        SET deleted_at = CURRENT_TIMESTAMP, 
//            email = CONCAT(email, '_deleted_', id)
//        WHERE id = $1
//        RETURNING id`,
//       [userId]
//     );

//     // Invalidate auth + workspace list caches
//     await invalidateCache(
//       buildKey('user', userId, 'auth'),
//       buildKey('user', userId, 'workspaces')   // ⬅️ ADD
//     );

//     return true;
//   }
// }

// module.exports = UserService;

const UserQueries = require('../db/queries/user.queries');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiry,
  verifyRefreshToken,
} = require('../utils/jwt.utils');
const {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
} = require('../utils/token.utils');
const { invalidateCache, buildKey } = require('../utils/cache.utils');
const EmailProducer = require('../jobs/email.producer');
const logger = require('../config/logger');
const SessionQueries = require('../db/queries/session.queries');

class UserService {
  async register(userData, metadata = {}) {
    const { email, password, name, jobTitle, timezone } = userData;

    const existingUser = await UserQueries.findByEmail(email);
    if (existingUser) {
      // Not an error for logging — it's a validation failure, handled by controller
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const user = await UserQueries.create({
      email,
      password_hash: hashedPassword,
      name,
      job_title: jobTitle,
      timezone: timezone || 'UTC',
    });

    // const accessToken = generateAccessToken({
    //   userId: user.id,
    //   email: user.email,
    // });

    // const refreshToken = generateRefreshToken({
    //   userId: user.id,
    //   email: user.email,
    // });

    // // const tokenExpiry = getTokenExpiry(refreshToken);
    // // await UserQueries.updateRefreshToken(user.id, refreshToken, tokenExpiry);
    // const tokenExpiry = getTokenExpiry(refreshToken);

    // await SessionQueries.create({
    //   userId: user.id,
    //   refreshToken,
    //   refreshTokenExpiry: tokenExpiry,
    //   userAgent: metadata?.userAgent,
    //   ipAddress: metadata?.ipAddress,
    // });

    // Create session FIRST so we can embed its ID in the JWT
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const tokenExpiry = getTokenExpiry(refreshToken);

    const session = await SessionQueries.create({
      userId: user.id,
      refreshToken,
      refreshTokenExpiry: tokenExpiry,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });

    // Now generate the access token with sessionId embedded
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,   // ⬅️ embed the session
    });

    try {
      const verificationToken = await createEmailVerificationToken(user.id, 24);
      await EmailProducer.queueVerification({
        to: user.email,
        name: user.name,
        token: verificationToken,
      });
    } catch (emailError) {
      // ⚠️ Non-fatal: log as warn, user is still registered
      logger.warn('Failed to queue verification email', {
        userId: user.id,
        email: user.email,
        error: emailError.message,
      });
    }

    // ✅ Success
    logger.info('User registered', {
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async login(email, password, metadata = {}) {
    const user = await UserQueries.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');
    if (user.deleted_at) throw new Error('Account has been deactivated');

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) throw new Error('Invalid email or password');

    await UserQueries.updateLastLogin(user.id);

    // const accessToken = generateAccessToken({
    //   userId: user.id,
    //   email: user.email,
    // });

    // const refreshToken = generateRefreshToken({
    //   userId: user.id,
    //   email: user.email,
    // });
    // Create session FIRST so we can embed its ID in the JWT
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const tokenExpiry = getTokenExpiry(refreshToken);

    const session = await SessionQueries.create({
      userId: user.id,
      refreshToken,
      refreshTokenExpiry: tokenExpiry,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });

    // Now generate the access token with sessionId embedded
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,   // ⬅️ embed the session
    });

    // const tokenExpiry = getTokenExpiry(refreshToken);

    // ⬇️ Save session instead of overwriting a single refresh token
    // await SessionQueries.create({
    //   userId: user.id,
    //   refreshToken,
    //   refreshTokenExpiry: tokenExpiry,
    //   userAgent: metadata.userAgent,
    //   ipAddress: metadata.ipAddress,
    // });
    // await UserQueries.updateRefreshToken(user.id, refreshToken, tokenExpiry);

    const { password_hash, refresh_token, refresh_token_expiry, ...userWithoutSensitive } = user;

    // ✅ Success
    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
    });

    return {
      user: userWithoutSensitive,
      tokens: { accessToken, refreshToken },
    };
  }

  // async refreshToken(refreshToken) {
  //   const decoded = verifyRefreshToken(refreshToken);
  //   if (!decoded) throw new Error('Invalid refresh token');

  //   const user = await UserQueries.findByRefreshToken(refreshToken);
  //   if (!user) throw new Error('Invalid refresh token');

  //   const newAccessToken = generateAccessToken({
  //     userId: user.id,
  //     email: user.email,
  //   });

  //   const newRefreshToken = generateRefreshToken({
  //     userId: user.id,
  //     email: user.email,
  //   });

  //   const tokenExpiry = getTokenExpiry(newRefreshToken);
  //   await UserQueries.updateRefreshToken(user.id, newRefreshToken, tokenExpiry);

  //   return {
  //     accessToken: newAccessToken,
  //     refreshToken: newRefreshToken,
  //   };
  // }
  async refreshToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) throw new Error('Invalid refresh token');

    // ⬇️ Look up session instead of user
    const session = await SessionQueries.findByRefreshToken(refreshToken);
    if (!session) throw new Error('Invalid or expired refresh token');

    const user = { id: session.user_id, email: session.email };

    // ✅ Include sessionId in the NEW access token too
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,   // ⬅️ CRITICAL
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const tokenExpiry = getTokenExpiry(newRefreshToken);

    await SessionQueries.rotateRefreshToken(
      session.id,
      newRefreshToken,
      tokenExpiry
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken, sessionId) {
    try {
      let targetSessionId = null;

      if (refreshToken) {
        const session = await SessionQueries.findByRefreshToken(refreshToken);
        if (session) {
          targetSessionId = session.id;
          await SessionQueries.deleteByRefreshToken(refreshToken);
        }
      }

      // Fallback: use sessionId from JWT
      if (!targetSessionId && sessionId) {
        targetSessionId = sessionId;
        await SessionQueries.deleteById(sessionId, sessionId);   // user_id doesn't matter here
      }

      if (targetSessionId) {
        await invalidateCache(buildKey('session', targetSessionId, 'active'));
      }
    } catch (err) {
      // Silent — logout should never fail
    }
    return true;
  }

  async logoutAllDevices(userId) {
    // Find all sessions first so we can invalidate their caches
    const sessions = await SessionQueries.findByUser(userId);
    await SessionQueries.deleteAllForUser(userId);

    // Invalidate caches
    const { invalidateCache, buildKey } = require('../utils/cache.utils');
    for (const s of sessions) {
      await invalidateCache(buildKey('session', s.id, 'active'));
    }

    return true;
  }

  async getUserProfile(userId) {
    const user = await UserQueries.findById(userId);
    if (!user) throw new Error('User not found');

    const { password_hash, refresh_token, refresh_token_expiry, ...userProfile } = user;
    return userProfile;
  }

  async updateProfile(userId, updateData) {
    const user = await UserQueries.update(userId, {
      name: updateData.name,
      bio: updateData.bio,
      job_title: updateData.jobTitle,
      timezone: updateData.timezone,
      profile_picture: updateData.profilePicture,
    });

    if (!user) throw new Error('User not found');

    await invalidateCache(buildKey('user', userId, 'auth'));

    // ✅ Success
    logger.info('User profile updated', { userId });

    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserQueries.findById(userId);
    if (!user) throw new Error('User not found');

    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) throw new Error('Current password is incorrect');

    const hashedPassword = await hashPassword(newPassword);
    await UserQueries.updatePassword(userId, hashedPassword);

    // await UserQueries.clearRefreshToken(userId);
    // await invalidateCache(buildKey('user', userId, 'auth'));

    // // ✅ Success — security-sensitive action

    // return true;
    await SessionQueries.deleteAllForUser(userId);   // ⬅️ logout all devices
    await invalidateCache(buildKey('user', userId, 'auth'));
    logger.info('User password changed', { userId });

    return true;
  }

  async sendVerificationEmail(userId) {
    const user = await UserQueries.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.is_email_verified) throw new Error('Email is already verified');

    const verificationToken = await createEmailVerificationToken(userId, 24);
    await EmailProducer.queueVerification({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });

    return true;
  }

  async verifyEmail(token) {
    const result = await verifyEmailVerificationToken(token);
    if (!result) throw new Error('Invalid or expired verification token');

    const user = await UserQueries.findById(result.userId);
    if (!user) throw new Error('User not found');
    if (user.is_email_verified) return user;

    await UserQueries.verifyEmail(result.userId);

    try {
      await EmailProducer.queueWelcome({
        to: user.email,
        name: user.name,
      });
    } catch (emailError) {
      // ⚠️ Non-fatal
      logger.warn('Failed to queue welcome email', {
        userId: user.id,
        error: emailError.message,
      });
    }

    // ✅ Success
    logger.info('Email verified', { userId: user.id, email: user.email });

    return { ...user, is_email_verified: true };
  }

  async forgotPassword(email) {
    const user = await UserQueries.findByEmail(email);
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = await createPasswordResetToken(user.id, 1);
    await EmailProducer.queuePasswordReset({
      to: user.email,
      name: user.name,
      token: resetToken,
    });

    // ✅ Log the request (but don't log the token!)
    logger.info('Password reset requested', { userId: user.id, email: user.email });

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token, newPassword) {
    const result = await verifyPasswordResetToken(token);
    if (!result) throw new Error('Invalid or expired reset token');

    const hashedPassword = await hashPassword(newPassword);
    await UserQueries.updatePassword(result.userId, hashedPassword);

    await markPasswordResetTokenUsed(result.tokenId);
    await UserQueries.clearRefreshToken(result.userId);

    // ✅ Success — security-sensitive
    logger.info('Password reset', { userId: result.userId });

    return true;
  }

  async deleteAccount(userId, password) {
    const user = await UserQueries.findById(userId);
    if (!user) throw new Error('User not found');

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) throw new Error('Password is incorrect');

    // await UserQueries.clearRefreshToken(userId);
    await SessionQueries.deleteAllForUser(userId);

    const QueryHelper = require('../db/queries/helper');
    await QueryHelper.query(
      `UPDATE users 
       SET deleted_at = CURRENT_TIMESTAMP, 
           email = CONCAT(email, '_deleted_', id)
       WHERE id = $1
       RETURNING id`,
      [userId]
    );

    await invalidateCache(
      buildKey('user', userId, 'auth'),
      buildKey('user', userId, 'workspaces')
    );

    // ✅ Success — compliance milestone
    logger.info('User account deleted', { userId, email: user.email });

    return true;
  }

  async getUserSessions(userId, currentSessionId = null) {
    const sessions = await SessionQueries.findByUser(userId);
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.user_agent,
      ipAddress: s.ip_address,
      createdAt: s.created_at,
      lastUsedAt: s.last_used_at,
      isCurrent: s.id === currentSessionId,   // ⬅️ compare by session ID
    }));
  }

  async revokeSession(sessionId, userId) {
    const deleted = await SessionQueries.deleteById(sessionId, userId);
    if (!deleted) throw new Error('Session not found');

    // ⬇️ Invalidate the session cache so the middleware rejects it immediately
    const { invalidateCache, buildKey } = require('../utils/cache.utils');
    await invalidateCache(buildKey('session', sessionId, 'active'));

    return true;
  }
}

module.exports = UserService;