const { verifyAccessToken } = require('../utils/jwt.utils');
const UserQueries = require('../db/queries/user.queries');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Verify user still exists
    const user = await UserQueries.findById(decoded.userId);
    if (!user || user.deleted_at) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deactivated',
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

module.exports = { authenticate };