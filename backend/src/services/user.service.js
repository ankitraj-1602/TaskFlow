const UserQueries = require('../db/queries/user.queries');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  getTokenExpiry,
  verifyAccessToken,
  verifyRefreshToken 
} = require('../utils/jwt.utils');

class UserService {
  async register(userData) {
    const { email, password, name, jobTitle, timezone } = userData;

    // Check if user already exists
    const existingUser = await UserQueries.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await UserQueries.create({
      email,
      password_hash: hashedPassword,
      name,
      job_title: jobTitle,
      timezone: timezone || 'UTC',
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    const tokenExpiry = getTokenExpiry(refreshToken);
    await UserQueries.updateRefreshToken(user.id, refreshToken, tokenExpiry);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async login(email, password) {
    // Find user
    const user = await UserQueries.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is deleted
    if (user.deleted_at) {
      throw new Error('Account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await UserQueries.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    const tokenExpiry = getTokenExpiry(refreshToken);
    await UserQueries.updateRefreshToken(user.id, refreshToken, tokenExpiry);

    // Remove sensitive data
    const { password_hash, refresh_token, refresh_token_expiry, ...userWithoutSensitive } = user;

    return {
      user: userWithoutSensitive,
      tokens: { accessToken, refreshToken },
    };
  }

  async refreshToken(refreshToken) {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Find user with this refresh token
    const user = await UserQueries.findByRefreshToken(refreshToken);
    if (!user) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Update refresh token
    const tokenExpiry = getTokenExpiry(newRefreshToken);
    await UserQueries.updateRefreshToken(user.id, newRefreshToken, tokenExpiry);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId) {
    await UserQueries.clearRefreshToken(userId);
    return true;
  }

  async logoutAllDevices(userId) {
    await UserQueries.clearRefreshToken(userId);
    return true;
  }

  async getUserProfile(userId) {
    const user = await UserQueries.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

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

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserQueries.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserQueries.updatePassword(userId, hashedPassword);

    // Clear all refresh tokens for security
    await UserQueries.clearRefreshToken(userId);

    return true;
  }

  async verifyEmail(userId) {
    await UserQueries.verifyEmail(userId);
    return true;
  }

  async forgotPassword(email) {
    const user = await UserQueries.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token (using JWT)
    const resetToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    // In a real app, you'd send this via email
    return {
      resetToken,
      message: 'Password reset token generated',
    };
  }

  async resetPassword(token, newPassword) {
    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserQueries.updatePassword(decoded.userId, hashedPassword);

    // Clear all refresh tokens
    await UserQueries.clearRefreshToken(decoded.userId);

    return true;
  }
}

module.exports = UserService;