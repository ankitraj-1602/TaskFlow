const { cleanupQueue } = require('../config/queues');

/**
 * Schedule recurring jobs.
 * Called once at server startup.
 */
const startScheduler = async () => {
  // Clean up expired tokens every 6 hours
  await cleanupQueue.add(
    'expired-tokens',
    {},
    {
      repeat: {
        pattern: '0 */6 * * *',   // every 6 hours
      },
      jobId: 'cleanup-expired-tokens',
    }
  );

  console.log('✅ Recurring jobs scheduled');
};

module.exports = { startScheduler };