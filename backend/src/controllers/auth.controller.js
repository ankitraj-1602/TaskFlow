const UserService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const userService = new UserService();

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, name, jobTitle, timezone } = req.body;

      const result = await userService.register({
        email,
        password,
        name,
        jobTitle,
        timezone,
      });

      successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await userService.login(email, password);
      successResponse(res, result, 'Login successful');
    } catch (error) {
      errorResponse(res, error.message, 401);
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return errorResponse(res, 'Refresh token required', 400);
      }

      const result = await userService.refreshToken(refreshToken);
      successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      errorResponse(res, error.message, 401);
    }
  }

  static async logout(req, res) {
    try {
      if (!req.user) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      await userService.logout(req.user.userId);
      successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }

  static async logoutAllDevices(req, res) {
    try {
      if (!req.user) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      await userService.logoutAllDevices(req.user.userId);
      successResponse(res, null, 'Logged out from all devices successfully');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }

  static async getProfile(req, res) {
    try {
      if (!req.user) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const profile = await userService.getUserProfile(req.user.userId);
      successResponse(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }

  static async updateProfile(req, res) {
    try {
      if (!req.user) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const { name, bio, jobTitle, timezone, profilePicture } = req.body;
      const profile = await userService.updateProfile(req.user.userId, {
        name,
        bio,
        jobTitle,
        timezone,
        profilePicture,
      });

      successResponse(res, profile, 'Profile updated successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async changePassword(req, res) {
    try {
      if (!req.user) {
        return errorResponse(res, 'User not authenticated', 401);
      }

      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user.userId, currentPassword, newPassword);

      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await userService.forgotPassword(email);

      successResponse(res, result, 'Password reset instructions sent');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      await userService.resetPassword(token, newPassword);

      successResponse(res, null, 'Password reset successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async sendVerificationEmail(req, res) {
  try {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    await userService.sendVerificationEmail(req.user.userId);
    successResponse(res, null, 'Verification email sent successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
}

static async verifyEmail(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return errorResponse(res, 'Verification token is required', 400);
    }

    const user = await userService.verifyEmail(token);
    successResponse(res, { email: user.email }, 'Email verified successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
}
static async deleteAccount(req, res) {
  try {
    if (!req.user) {
      return errorResponse(res, 'User not authenticated', 401);
    }

    const { password } = req.body;
    if (!password) {
      return errorResponse(res, 'Password is required', 400);
    }

    await userService.deleteAccount(req.user.userId, password);
    successResponse(res, null, 'Account deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
}
}

module.exports = AuthController;