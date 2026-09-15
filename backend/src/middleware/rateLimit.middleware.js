// const rateLimit = require('express-rate-limit');

// const authRateLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 500, // 5 attempts
//   message: {
//     success: false,
//     message: 'Too many authentication attempts. Please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const apiRateLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 1000, // 100 requests per hour
//   message: {
//     success: false,
//     message: 'Too many requests. Please try again later.',
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// module.exports = { authRateLimiter, apiRateLimiter };

const { getRedis, isRedisReady } = require('../config/redis');

/**
 * Redis-backed sliding-window rate limiter.
 * Falls back to fail-open if Redis is down.
 */
const createRedisRateLimiter = (options) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    keyPrefix = 'rl',
    message = 'Too many requests. Please try again later.',
  } = options;

  return async (req, res, next) => {
    // Fail-open if Redis is down — the app should still work
    if (!isRedisReady()) {
      return next();
    }

    const redis = getRedis();
    const identifier = req.user?.userId || req.ip || req.socket.remoteAddress;
    const windowBucket = Math.floor(Date.now() / windowMs);
    const key = `${keyPrefix}:${identifier}:${windowBucket}`;

    try {
      const count = await redis.incr(key);

      // Set expiry on first hit
      if (count === 1) {
        await redis.pExpire(key, windowMs);
      }

      const ttl = await redis.pTTL(key);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + ttl) / 1000));

      if (count > max) {
        return res.status(429).json({
          success: false,
          message,
        });
      }

      next();
    } catch (err) {
      console.error('Rate limit error:', err.message);
      next();
    }
  };
};

const authRateLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  keyPrefix: 'rl:auth',
  message: 'Too many auth attempts. Please try again later.',
});

const apiRateLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000, // 1 min
  max: 300,
  keyPrefix: 'rl:api',
  message: 'Too many requests. Please slow down.',
});

module.exports = {
  authRateLimiter,
  apiRateLimiter,
};