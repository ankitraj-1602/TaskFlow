const { Queue } = require('bullmq');

// Redis connection config for BullMQ
// BullMQ manages its own connection — don't reuse the existing redis client
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// ─── Define Queues ─────────────────────────────────
const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,              // retry 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000,            // start with 2s, then 4s, then 8s
    },
    removeOnComplete: {
      age: 3600,              // keep completed jobs for 1 hour
      count: 1000,            // keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400,             // keep failed jobs for 24 hours
      count: 5000,            // keep max 5000 failed jobs
    },
  },
});

const notificationQueue = new Queue('notification', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 600, count: 500 },
    removeOnFail: { age: 86400 },
  },
});

const cleanupQueue = new Queue('cleanup', {
  connection,
  defaultJobOptions: {
    attempts: 1,              // cleanup failures don't need retry
    removeOnComplete: { age: 3600 },
  },
});

console.log('✅ BullMQ queues initialized');

module.exports = {
  emailQueue,
  notificationQueue,
  cleanupQueue,
  connection,
};