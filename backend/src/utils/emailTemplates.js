const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .header { background: #4f46e5; color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 32px; color: #333; line-height: 1.6; }
    .content h2 { color: #111; margin-top: 0; }
    .button { display: inline-block; background: #4f46e5; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #4338ca; }
    .footer { background: #f9fafb; padding: 24px 32px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .divider { border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .code { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; }
    .link-fallback { font-size: 13px; color: #6b7280; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TaskFlow</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TaskFlow. All rights reserved.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

const emailVerificationTemplate = ({ name, verificationUrl }) => baseTemplate(`
  <h2>Hi ${name},</h2>
  <p>Thanks for signing up for TaskFlow! To complete your registration and start managing your projects, please verify your email address.</p>
  <div style="text-align: center;">
    <a href="${verificationUrl}" class="button">Verify Email Address</a>
  </div>
  <p>This verification link will expire in <strong>24 hours</strong>.</p>
  <div class="divider"></div>
  <p class="link-fallback">If the button doesn't work, copy and paste this link into your browser:</p>
  <p class="link-fallback">${verificationUrl}</p>
`);

const passwordResetTemplate = ({ name, resetUrl }) => baseTemplate(`
  <h2>Hi ${name},</h2>
  <p>We received a request to reset your TaskFlow password. Click the button below to choose a new password.</p>
  <div style="text-align: center;">
    <a href="${resetUrl}" class="button">Reset Password</a>
  </div>
  <p>This reset link will expire in <strong>1 hour</strong> for security reasons.</p>
  <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  <div class="divider"></div>
  <p class="link-fallback">If the button doesn't work, copy and paste this link into your browser:</p>
  <p class="link-fallback">${resetUrl}</p>
`);

const welcomeTemplate = ({ name }) => baseTemplate(`
  <h2>Welcome to TaskFlow, ${name}! 🎉</h2>
  <p>Your email has been successfully verified. You're all set to start managing your projects, teams, and tasks.</p>
  <p>Here's what you can do next:</p>
  <ul>
    <li>Create your first workspace</li>
    <li>Invite your team members</li>
    <li>Set up your first project</li>
    <li>Start tracking tasks with our Kanban board</li>
  </ul>
  <div style="text-align: center;">
    <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
  </div>
`);

const workspaceInvitationTemplate = ({ inviterName, workspaceName, role, invitationUrl }) => baseTemplate(`
  <h2>You've been invited to join ${workspaceName}</h2>
  <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> as a <strong>${role}</strong>.</p>
  <p>TaskFlow helps teams organize projects, track tasks, and collaborate in real-time.</p>
  <div style="text-align: center;">
    <a href="${invitationUrl}" class="button">Accept Invitation</a>
  </div>
  <p>This invitation will expire in <strong>7 days</strong>.</p>
  <div class="divider"></div>
  <p class="link-fallback">If the button doesn't work, copy and paste this link into your browser:</p>
  <p class="link-fallback">${invitationUrl}</p>
`);

module.exports = {
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeTemplate,
  workspaceInvitationTemplate,
};