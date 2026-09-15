const { Worker } = require('bullmq');
const { connection } = require('../config/queues');

const notificationWorker = new Worker(
  'notification',
  async (job) => {
    const { name, data } = job;
    console.log(`🔔 Processing notification job: ${name} (id: ${job.id})`);

    try {
      // Placeholder — notifications are already saved synchronously
      // This worker is a hook for future: batch processing, digest emails, push notifications
      // For now, just log.

      console.log(`✅ Notification processed: ${name}`);
      return { processed: true };
    } catch (error) {
      console.error(`❌ Notification job ${name} failed:`, error.message);
      throw error;
    }
  },
  { connection, concurrency: 10 }
);

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Notification job failed:`, err.message);
});

console.log('✅ Notification worker started');

module.exports = notificationWorker;