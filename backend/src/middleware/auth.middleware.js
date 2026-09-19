// // const { verifyAccessToken } = require('../utils/jwt.utils');
// // const UserQueries = require('../db/queries/user.queries');

// // const authenticate = async (req, res, next) => {
// //   try {
// //     const authHeader = req.headers.authorization;
// //     if (!authHeader || !authHeader.startsWith('Bearer ')) {
// //       return res.status(401).json({
// //         success: false,
// //         message: 'Authentication required',
// //       });
// //     }

// //     const token = authHeader.split(' ')[1];
// //     const decoded = verifyAccessToken(token);

// //     if (!decoded) {
// //       return res.status(401).json({
// //         success: false,
// //         message: 'Invalid or expired token',
// //       });
// //     }

// //     // Verify user still exists
// //     const user = await UserQueries.findById(decoded.userId);
// //     if (!user || user.deleted_at) {
// //       return res.status(401).json({
// //         success: false,
// //         message: 'User not found or deactivated',
// //       });
// //     }

// //     req.user = {
// //       userId: decoded.userId,
// //       email: decoded.email,
// //     };

// //     next();
// //   } catch (error) {
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Authentication error',
// //     });
// //   }
// // };

// // module.exports = { authenticate };

// const { verifyAccessToken } = require('../utils/jwt.utils');
// const UserQueries = require('../db/queries/user.queries');
// const { cacheWrapper, buildKey } = require('../utils/cache.utils');

// const authenticate = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ success: false, message: 'Authentication required' });
//     }

//     const token = authHeader.split(' ')[1];
//     const decoded = verifyAccessToken(token);

//     if (!decoded) {
//       return res.status(401).json({ success: false, message: 'Invalid or expired token' });
//     }

//     // ⬇️ Cache user lookup (30s TTL)
//     const cacheKey = buildKey('user', decoded.userId, 'auth');
//     const user = await cacheWrapper(cacheKey, 300, async () => {
//       return await UserQueries.findById(decoded.userId);
//     });

//     if (!user || user.deleted_at) {
//       return res.status(401).json({ success: false, message: 'User not found or deactivated' });
//     }

//     req.user = {
//       userId: decoded.userId,
//       email: decoded.email,
//     };

//     next();
//   } catch (error) {
//     return res.status(500).json({ success: false, message: 'Authentication error' });
//   }
// };

// module.exports = { authenticate };



const { verifyAccessToken } = require('../utils/jwt.utils');
const UserQueries = require('../db/queries/user.queries');
const { cacheWrapper, buildKey } = require('../utils/cache.utils');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // ⚠️ Auth failure — log as warn (not error — this is expected for public routes)
      logger.warn('Auth failed: missing or malformed header', {
        correlationId: req.correlationId,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      logger.warn('Auth failed: invalid or expired token', {
        correlationId: req.correlationId,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Cache user lookup (300s TTL)
    const cacheKey = buildKey('user', decoded.userId, 'auth');
    const user = await cacheWrapper(cacheKey, 300, async () => {
      return await UserQueries.findById(decoded.userId);
    });

    if (!user || user.deleted_at) {
      logger.warn('Auth failed: user not found or deactivated', {
        correlationId: req.correlationId,
        userId: decoded.userId,
        url: req.originalUrl,
        method: req.method,
      });

      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // ❌ Real error (e.g., DB down, cache crash)
    logger.error('Auth middleware error', {
      correlationId: req.correlationId,
      url: req.originalUrl,
      method: req.method,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

module.exports = { authenticate };