// // const { Worker } = require('bullmq');
// // const { connection } = require('../config/queues');

// // const notificationWorker = new Worker(
// //   'notification',
// //   async (job) => {
// //     const { name, data } = job;
// //     console.log(`🔔 Processing notification job: ${name} (id: ${job.id})`);

// //     try {
// //       // Placeholder — notifications are already saved synchronously
// //       // This worker is a hook for future: batch processing, digest emails, push notifications
// //       // For now, just log.

// //       console.log(`✅ Notification processed: ${name}`);
// //       return { processed: true };
// //     } catch (error) {
// //       console.error(`❌ Notification job ${name} failed:`, error.message);
// //       throw error;
// //     }
// //   },
// //   { connection, concurrency: 10 }
// // );

// // notificationWorker.on('failed', (job, err) => {
// //   console.error(`❌ Notification job failed:`, err.message);
// // });

// // console.log('✅ Notification worker started');

// // module.exports = notificationWorker;


// const { Worker } = require('bullmq');
// const { connection } = require('../config/queues');

// const notificationWorker = new Worker(
//   'notification',
//   async (job) => {
//     const { name, data } = job;
//     console.log(`🔔 Processing notification job: ${name} (id: ${job.id})`);

//     try {
//       // Placeholder — notifications saved synchronously
//       // This worker is a hook for future batch/push logic
//       console.log(`✅ Notification processed: ${name}`);
//       return { processed: true };
//     } catch (error) {
//       console.error(`❌ Notification job ${name} failed:`, error.message);
//       throw error;
//     }
//   },
//   { connection, concurrency: 10 }
// );

// notificationWorker.on('failed', (job, err) => {
//   console.error(`❌ Notification job failed:`, err.message);
// });

// notificationWorker.on('error', (err) => {
//   if (err.code !== 'EPIPE' && !err.message.includes('Socket closed')) {
//     console.error('❌ Notification worker error:', err.message);
//   }
// });

// console.log('✅ Notification worker started');

// module.exports = notificationWorker;




const { Worker } = require('bullmq');
const { sharedConnection } = require('../config/queues');

const notificationWorker = new Worker(
  'notification',
  async (job) => {
    console.log(`🔔 Notification job: ${job.name}`);
    return { processed: true };
  },
  { connection: sharedConnection, concurrency: 5 }
);

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Notification job failed:`, err.message);
});
notificationWorker.on('error', (err) => {
  if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
    console.error('❌ Notification worker error:', err.message);
  }
});

console.log('✅ Notification worker started');
module.exports = notificationWorker;