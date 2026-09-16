// // const { Worker } = require('bullmq');
// // const { connection } = require('../config/queues');
// // const QueryHelper = require('../db/queries/helper');

// // const cleanupWorker = new Worker(
// //   'cleanup',
// //   async (job) => {
// //     console.log(`🧹 Running cleanup job: ${job.name}`);

// //     if (job.name === 'expired-tokens') {
// //       // Clean up expired email verification tokens
// //       const verifyResult = await QueryHelper.query(
// //         `DELETE FROM email_verification_tokens 
// //          WHERE expires_at < CURRENT_TIMESTAMP`
// //       );

// //       // Clean up expired password reset tokens
// //       const resetResult = await QueryHelper.query(
// //         `DELETE FROM password_reset_tokens 
// //          WHERE expires_at < CURRENT_TIMESTAMP`
// //       );

// //       // Clean up expired workspace invitations
// //       const inviteResult = await QueryHelper.query(
// //         `DELETE FROM workspace_invitations 
// //          WHERE expires_at < CURRENT_TIMESTAMP AND accepted_at IS NULL`
// //       );

// //       console.log(
// //         `🧹 Cleanup: ${verifyResult.rowCount} verify tokens, ` +
// //         `${resetResult.rowCount} reset tokens, ` +
// //         `${inviteResult.rowCount} invitations`
// //       );

// //       return {
// //         verifyTokens: verifyResult.rowCount,
// //         resetTokens: resetResult.rowCount,
// //         invitations: inviteResult.rowCount,
// //       };
// //     }

// //     return { skipped: true };
// //   },
// //   { connection }
// // );

// // console.log('✅ Cleanup worker started');

// // module.exports = cleanupWorker;


// const { Worker } = require('bullmq');
// const { connection } = require('../config/queues');
// const QueryHelper = require('../db/queries/helper');

// const cleanupWorker = new Worker(
//   'cleanup',
//   async (job) => {
//     console.log(`🧹 Running cleanup job: ${job.name}`);

//     if (job.name === 'expired-tokens') {
//       // Clean up expired email verification tokens
//       const verifyResult = await QueryHelper.query(
//         `DELETE FROM email_verification_tokens 
//          WHERE expires_at < CURRENT_TIMESTAMP`
//       );

//       // Clean up expired password reset tokens
//       const resetResult = await QueryHelper.query(
//         `DELETE FROM password_reset_tokens 
//          WHERE expires_at < CURRENT_TIMESTAMP`
//       );

//       // Clean up expired workspace invitations
//       const inviteResult = await QueryHelper.query(
//         `DELETE FROM workspace_invitations 
//          WHERE expires_at < CURRENT_TIMESTAMP AND accepted_at IS NULL`
//       );

//       console.log(
//         `🧹 Cleanup: ${verifyResult.rowCount} verify tokens, ` +
//         `${resetResult.rowCount} reset tokens, ` +
//         `${inviteResult.rowCount} invitations`
//       );

//       return {
//         verifyTokens: verifyResult.rowCount,
//         resetTokens: resetResult.rowCount,
//         invitations: inviteResult.rowCount,
//       };
//     }

//     return { skipped: true };
//   },
//   { connection }
// );

// cleanupWorker.on('error', (err) => {
//   if (err.code !== 'EPIPE' && !err.message.includes('Socket closed')) {
//     console.error('❌ Cleanup worker error:', err.message);
//   }
// });

// console.log('✅ Cleanup worker started');

// module.exports = cleanupWorker;




const { Worker } = require('bullmq');
const { sharedConnection } = require('../config/queues');
const QueryHelper = require('../db/queries/helper');

const cleanupWorker = new Worker(
  'cleanup',
  async (job) => {
    console.log(`🧹 Cleanup job: ${job.name}`);

    if (job.name === 'expired-tokens') {
      const verifyResult = await QueryHelper.query(
        `DELETE FROM email_verification_tokens WHERE expires_at < CURRENT_TIMESTAMP`
      );
      const resetResult = await QueryHelper.query(
        `DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP`
      );
      const inviteResult = await QueryHelper.query(
        `DELETE FROM workspace_invitations WHERE expires_at < CURRENT_TIMESTAMP AND accepted_at IS NULL`
      );
      return {
        verifyTokens: verifyResult.rowCount,
        resetTokens: resetResult.rowCount,
        invitations: inviteResult.rowCount,
      };
    }
    return { skipped: true };
  },
  { connection: sharedConnection }
);

cleanupWorker.on('error', (err) => {
  if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
    console.error('❌ Cleanup worker error:', err.message);
  }
});

console.log('✅ Cleanup worker started');
module.exports = cleanupWorker;