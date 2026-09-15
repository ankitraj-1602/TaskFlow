const { getRedis, isRedisReady } = require('../config/redis');

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300');

/**
 * Read-through cache:
 * - Check Redis first
 * - On miss, call fetchFn
 * - Write result to Redis with TTL
 * - On Redis error, fall through to fetchFn (fail-open)
 */
const cacheWrapper = async (key, ttlSeconds, fetchFn) => {
  if (!isRedisReady()) {
    return fetchFn();
  }

  const redis = getRedis();

  try {
    const cached = await redis.get(key);
    if (cached !== null && cached !== undefined) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Cache read error:', err.message);
  }

  const fresh = await fetchFn();

  try {
    const ttl = ttlSeconds || DEFAULT_TTL;
    await redis.setEx(key, ttl, JSON.stringify(fresh));
  } catch (err) {
    console.error('Cache write error:', err.message);
  }

  return fresh;
};

/**
 * Invalidate one or more cache keys.
 * Supports wildcards via SCAN (production-safe).
 */
const invalidateCache = async (...keys) => {
  if (!isRedisReady()) return;

  const redis = getRedis();

  try {
    for (const key of keys) {
      if (key.includes('*')) {
        // Use SCAN instead of KEYS for production safety
        let cursor = '0';
        const toDelete = [];

        do {
          const result = await redis.scan(cursor, {
            MATCH: key,
            COUNT: 100,
          });
          cursor = result.cursor;
          toDelete.push(...result.keys);
        } while (cursor !== '0');

        if (toDelete.length > 0) {
          await redis.del(toDelete);
        }
      } else {
        await redis.del(key);
      }
    }
  } catch (err) {
    console.error('Cache invalidation error:', err.message);
  }
};

/**
 * Build a namespaced cache key.
 * Example: buildKey('dashboard', 'stats', workspaceId) → "dashboard:stats:<uuid>"
 */
const buildKey = (prefix, ...parts) => {
  return [prefix, ...parts].filter((p) => p !== null && p !== undefined).join(':');
};

module.exports = {
  cacheWrapper,
  invalidateCache,
  buildKey,
  DEFAULT_TTL,
};