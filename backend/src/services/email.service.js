const transporter = require('../config/email');
const {
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeTemplate,
  workspaceInvitationTemplate,
} = require('../utils/emailTemplates');

class EmailService {
  async sendEmail({ to, subject, html }) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'TaskFlow <noreply@taskflow.dev>',
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail({ to, name, token }) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = emailVerificationTemplate({ name, verificationUrl });
    return this.sendEmail({
      to,
      subject: 'Verify your TaskFlow email',
      html,
    });
  }

  async sendPasswordResetEmail({ to, name, token }) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = passwordResetTemplate({ name, resetUrl });
    return this.sendEmail({
      to,
      subject: 'Reset your TaskFlow password',
      html,
    });
  }

  async sendWelcomeEmail({ to, name }) {
    const html = welcomeTemplate({ name });
    return this.sendEmail({
      to,
      subject: 'Welcome to TaskFlow! 🎉',
      html,
    });
  }

  async sendWorkspaceInvitation({ to, inviterName, workspaceName, role, token }) {
    const invitationUrl = `${process.env.FRONTEND_URL}/invitations/${token}`;
    const html = workspaceInvitationTemplate({ inviterName, workspaceName, role, invitationUrl });
    return this.sendEmail({
      to,
      subject: `You've been invited to join ${workspaceName} on TaskFlow`,
      html,
    });
  }
}

module.exports = new EmailService();