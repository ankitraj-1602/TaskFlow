const { emailQueue } = require('../config/queues');

class EmailProducer {
  /**
   * Queue a verification email.
   */
  static async queueVerification({ to, name, token }) {
    return emailQueue.add(
      'verification',
      { to, name, token },
      { jobId: `verify:${to}:${Date.now()}` }
    );
  }

  /**
   * Queue a welcome email.
   */
  static async queueWelcome({ to, name }) {
    return emailQueue.add(
      'welcome',
      { to, name },
      { jobId: `welcome:${to}:${Date.now()}` }
    );
  }

  /**
   * Queue a password reset email.
   */
  static async queuePasswordReset({ to, name, token }) {
    return emailQueue.add(
      'password-reset',
      { to, name, token },
      { jobId: `reset:${to}:${Date.now()}` }
    );
  }

  /**
   * Queue a workspace invitation email.
   */
  static async queueWorkspaceInvitation({
    to,
    inviterName,
    workspaceName,
    role,
    token,
  }) {
    return emailQueue.add(
      'workspace-invitation',
      { to, inviterName, workspaceName, role, token },
      { jobId: `invite:${to}:${Date.now()}` }
    );
  }
}

module.exports = EmailProducer;