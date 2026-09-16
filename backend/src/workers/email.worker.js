// // const { Worker } = require('bullmq');
// // const { connection } = require('../config/queues');
// // const emailService = require('../services/email.service');

// // const emailWorker = new Worker(
// //   'email',
// //   async (job) => {
// //     const { name, data } = job;
// //     console.log(`📧 Processing email job: ${name} (id: ${job.id})`);

// //     try {
// //       switch (name) {
// //         case 'verification':
// //           await emailService.sendVerificationEmail({
// //             to: data.to,
// //             name: data.name,
// //             token: data.token,
// //           });
// //           break;

// //         case 'welcome':
// //           await emailService.sendWelcomeEmail({
// //             to: data.to,
// //             name: data.name,
// //           });
// //           break;

// //         case 'password-reset':
// //           await emailService.sendPasswordResetEmail({
// //             to: data.to,
// //             name: data.name,
// //             token: data.token,
// //           });
// //           break;

// //         case 'workspace-invitation':
// //           await emailService.sendWorkspaceInvitation({
// //             to: data.to,
// //             inviterName: data.inviterName,
// //             workspaceName: data.workspaceName,
// //             role: data.role,
// //             token: data.token,
// //           });
// //           break;

// //         default:
// //           throw new Error(`Unknown email job type: ${name}`);
// //       }

// //       console.log(`✅ Email sent: ${name} → ${data.to}`);
// //       return { sent: true, to: data.to };
// //     } catch (error) {
// //       console.error(`❌ Email job ${name} failed:`, error.message);
// //       throw error; // re-throw so BullMQ retries
// //     }
// //   },
// //   {
// //     connection,
// //     concurrency: 5,           // process up to 5 emails at once
// //     limiter: {
// //       max: 10,                // max 10 jobs
// //       duration: 1000,         // per second (protects SMTP rate limits)
// //     },
// //   }
// // );

// // // ─── Event Listeners ───────────────────────────────
// // emailWorker.on('completed', (job) => {
// //   console.log(`✅ Email job ${job.id} completed`);
// // });

// // emailWorker.on('failed', (job, err) => {
// //   console.error(`❌ Email job ${job?.id} failed:`, err.message);
// // });

// // emailWorker.on('error', (err) => {
// //   console.error('❌ Email worker error:', err.message);
// // });

// // console.log('✅ Email worker started');

// // module.exports = emailWorker;

// const { Worker } = require('bullmq');
// const { connection } = require('../config/queues');
// const emailService = require('../services/email.service');

// const emailWorker = new Worker(
//   'email',
//   async (job) => {
//     const { name, data } = job;
//     console.log(`📧 Processing email job: ${name} (id: ${job.id})`);

//     try {
//       switch (name) {
//         case 'verification':
//           await emailService.sendVerificationEmail({
//             to: data.to,
//             name: data.name,
//             token: data.token,
//           });
//           break;

//         case 'welcome':
//           await emailService.sendWelcomeEmail({
//             to: data.to,
//             name: data.name,
//           });
//           break;

//         case 'password-reset':
//           await emailService.sendPasswordResetEmail({
//             to: data.to,
//             name: data.name,
//             token: data.token,
//           });
//           break;

//         case 'workspace-invitation':
//           await emailService.sendWorkspaceInvitation({
//             to: data.to,
//             inviterName: data.inviterName,
//             workspaceName: data.workspaceName,
//             role: data.role,
//             token: data.token,
//           });
//           break;

//         default:
//           throw new Error(`Unknown email job type: ${name}`);
//       }

//       console.log(`✅ Email sent: ${name} → ${data.to}`);
//       return { sent: true, to: data.to };
//     } catch (error) {
//       console.error(`❌ Email job ${name} failed:`, error.message);
//       throw error;
//     }
//   },
//   {
//     connection,
//     concurrency: 5,
//     limiter: { max: 10, duration: 1000 },
//   }
// );

// emailWorker.on('completed', (job) => {
//   console.log(`✅ Email job ${job.id} completed`);
// });

// emailWorker.on('failed', (job, err) => {
//   console.error(`❌ Email job ${job?.id} failed:`, err.message);
// });

// emailWorker.on('error', (err) => {
//   // Silence EPIPE noise
//   if (err.code !== 'EPIPE' && !err.message.includes('Socket closed')) {
//     console.error('❌ Email worker error:', err.message);
//   }
// });

// console.log('✅ Email worker started');

// module.exports = emailWorker;





const { Worker } = require('bullmq');
const { sharedConnection } = require('../config/queues');
const emailService = require('../services/email.service');

const emailWorker = new Worker(
  'email',
  async (job) => {
    const { name, data } = job;
    console.log(`📧 Processing email job: ${name}`);

    try {
      switch (name) {
        case 'verification':
          await emailService.sendVerificationEmail({
            to: data.to, name: data.name, token: data.token,
          });
          break;
        case 'welcome':
          await emailService.sendWelcomeEmail({ to: data.to, name: data.name });
          break;
        case 'password-reset':
          await emailService.sendPasswordResetEmail({
            to: data.to, name: data.name, token: data.token,
          });
          break;
        case 'workspace-invitation':
          await emailService.sendWorkspaceInvitation({
            to: data.to, inviterName: data.inviterName,
            workspaceName: data.workspaceName, role: data.role, token: data.token,
          });
          break;
        default:
          throw new Error(`Unknown email job type: ${name}`);
      }
      console.log(`✅ Email sent: ${name} → ${data.to}`);
      return { sent: true };
    } catch (error) {
      console.error(`❌ Email job ${name} failed:`, error.message);
      throw error;
    }
  },
  {
    connection: sharedConnection,
    concurrency: 3,              // ⬅️ reduced from 5
    limiter: { max: 5, duration: 1000 },  // ⬅️ reduced from 10
  }
);

emailWorker.on('completed', (job) => console.log(`✅ Email job ${job.id} done`));
emailWorker.on('failed', (job, err) => console.error(`❌ Email job failed:`, err.message));
emailWorker.on('error', (err) => {
  if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
    console.error('❌ Email worker error:', err.message);
  }
});

console.log('✅ Email worker started');
module.exports = emailWorker;