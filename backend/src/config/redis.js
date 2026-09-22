// // // const { createClient } = require('redis');

// // // const client = createClient({
// // //   url: process.env.REDIS_URL || 'redis://localhost:6379',
// // //   socket: {
// // //     reconnectStrategy: (retries) => {
// // //       if (retries > 10) {
// // //         console.error('❌ Redis: max reconnect attempts reached');
// // //         return new Error('Redis max retries');
// // //       }
// // //       // Exponential backoff, capped at 3s
// // //       return Math.min(retries * 200, 3000);
// // //     },
// // //   },
// // // });

// // // client.on('connect', () => console.log('✅ Redis connected'));
// // // client.on('ready', () => console.log('🟢 Redis ready'));
// // // client.on('error', (err) => console.error('❌ Redis error:', err.message));
// // // client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

// // // let isConnected = false;

// // // const connectRedis = async () => {
// // //   if (isConnected) return;
// // //   try {
// // //     await client.connect();
// // //     isConnected = true;
// // //   } catch (err) {
// // //     console.error('❌ Redis connect failed:', err.message);
// // //     // Don't throw — app should work without Redis
// // //   }
// // // };

// // // const getRedis = () => client;
// // // const isRedisReady = () => client.isReady;

// // // module.exports = {
// // //   client,
// // //   connectRedis,
// // //   getRedis,
// // //   isRedisReady,
// // // };


// // const { createClient } = require('redis');

// // const isProduction = process.env.NODE_ENV === 'production';

// // const client = createClient({
// //   url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
// //   socket: {
// //     // ⬇️ Upstash uses rediss:// (TLS). This is auto-detected from URL.
// //     tls: process.env.REDIS_URL?.startsWith('rediss://') || false,
// //     reconnectStrategy: (retries) => {
// //       if (retries > 10) {
// //         console.error('❌ Redis: max reconnect attempts');
// //         return new Error('Redis max retries');
// //       }
// //       return Math.min(retries * 200, 3000);
// //     },
// //   },
// // });

// // client.on('connect', () => console.log('✅ Redis connected'));
// // client.on('ready', () => console.log('🟢 Redis ready'));
// // client.on('error', (err) => console.error('❌ Redis error:', err.message));

// // module.exports = { client, getRedis: () => client, isRedisReady: () => client.isReady, connectRedis: async () => {
// //   if (!client.isOpen) await client.connect();
// // }};

// const { createClient } = require('redis');
// require('dotenv').config();

// const client = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379',
//   socket: {
//     tls: process.env.REDIS_URL?.startsWith('rediss://') || false,
//     keepAlive: 10000,
//     reconnectStrategy: (retries) => {
//       if (retries > 20) {
//         console.error('❌ Redis: max reconnect attempts reached');
//         return new Error('Redis max retries');
//       }
//       return Math.min(retries * 200, 3000);
//     },
//   },
// });

// client.on('connect', () => console.log('✅ Redis connected'));
// client.on('ready', () => console.log('🟢 Redis ready'));
// client.on('error', (err) => {
//   // Silence EPIPE and "Socket closed" — they're transient on Upstash
//   if (err.code !== 'EPIPE' && !err.message.includes('Socket closed')) {
//     console.error('❌ Redis error:', err.message);
//   }
// });

// let isConnected = false;

// const connectRedis = async () => {
//   if (isConnected) return;
//   try {
//     await client.connect();
//     isConnected = true;
//   } catch (err) {
//     console.error('❌ Redis connect failed:', err.message);
//   }
// };

// module.exports = {
//   client,
//   connectRedis,
//   getRedis: () => client,
//   isRedisReady: () => client.isReady,
// };


const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    family:0,
    tls: process.env.REDIS_URL?.startsWith('rediss://') || false,
    keepAlive: 30000,
    reconnectStrategy: (retries) => {
      if (retries > 30) return new Error('Redis max retries');
      return Math.min(retries * 500, 5000);
    },
    connectTimeout: 20000,
  },
});

client.on('connect', () => console.log('✅ Redis connected'));
client.on('ready', () => console.log('🟢 Redis ready'));
client.on('error', (err) => {
  // Silence all transient errors
  if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET' && !err.message.includes('Socket closed')) {
    console.error('❌ Redis error:', err.message);
  }
});

let isConnected = false;

const connectRedis = async () => {
  if (isConnected) return;
  try {
    await client.connect();
    isConnected = true;
  } catch (err) {
    console.error('❌ Redis connect failed:', err.message);
  }
};

module.exports = {
  client,
  connectRedis,
  getRedis: () => client,
  isRedisReady: () => client.isReady,
};