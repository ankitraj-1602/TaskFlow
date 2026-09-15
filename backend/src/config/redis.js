const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: max reconnect attempts reached');
        return new Error('Redis max retries');
      }
      // Exponential backoff, capped at 3s
      return Math.min(retries * 200, 3000);
    },
  },
});

client.on('connect', () => console.log('✅ Redis connected'));
client.on('ready', () => console.log('🟢 Redis ready'));
client.on('error', (err) => console.error('❌ Redis error:', err.message));
client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

let isConnected = false;

const connectRedis = async () => {
  if (isConnected) return;
  try {
    await client.connect();
    isConnected = true;
  } catch (err) {
    console.error('❌ Redis connect failed:', err.message);
    // Don't throw — app should work without Redis
  }
};

const getRedis = () => client;
const isRedisReady = () => client.isReady;

module.exports = {
  client,
  connectRedis,
  getRedis,
  isRedisReady,
};