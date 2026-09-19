// const WorkspaceQueries = require('../db/queries/workspace.queries');
// const UserQueries = require('../db/queries/user.queries');
// const InvitationQueries = require('../db/queries/invitation.queries');
// const { createWorkspaceInvitationToken } = require('../utils/token.utils');
// const emailService = require('./email.service');
// const NotificationService = require('./notification.service');
// const notificationService = new NotificationService();
// const { cacheWrapper, invalidateCache, buildKey } = require('../utils/cache.utils');
// const EmailProducer = require('../jobs/email.producer');

// class WorkspaceService {
//   // ─── Helper: standard member-related cache invalidation ─────
//   /**
//    * Invalidate all caches affected by a member change.
//    * @param {string} workspaceId
//    * @param {string} memberUserId - The affected user's ID
//    */
//   async invalidateMemberCaches(workspaceId, memberUserId) {
//     await invalidateCache(
//       buildKey('workspace', workspaceId, 'members'),
//       buildKey('workspace', workspaceId, 'members-list'),
//       buildKey('workspace', workspaceId, 'access', memberUserId),
//       buildKey('workspace', workspaceId, 'ismember', memberUserId),
//       buildKey('workspace', workspaceId, 'role', memberUserId),
//       buildKey('workspace', workspaceId, 'member-of-user', memberUserId),
//       buildKey('user', '*', 'workspaces'),
//       buildKey('dashboard', '*', workspaceId)
//     );
//   }

//   // ─── Workspace CRUD ────────────────────────────────────────
//   async createWorkspace(userId, data) {
//     const { name, description } = data;
//     const slug = this.generateSlug(name);

//     const existingWorkspace = await WorkspaceQueries.findBySlug(slug);
//     if (existingWorkspace) {
//       throw new Error('A workspace with this name already exists');
//     }

//     const workspace = await WorkspaceQueries.create({
//       name,
//       slug,
//       description,
//       ownerId: userId,
//     });

//     await WorkspaceQueries.addMember(workspace.id, userId, 'OWNER', userId);

//     // Invalidate user's workspace list + access
//     await invalidateCache(
//       buildKey('user', userId, 'workspaces'),
//       buildKey('workspace', workspace.id, 'access', userId),
//       buildKey('workspace', workspace.id, 'isowner', userId),
//       buildKey('workspace', workspace.id, 'ismember', userId)
//     );

//     return workspace;
//   }

//   async getUserWorkspaces(userId) {
//     const cacheKey = buildKey('user', userId, 'workspaces');
//     return cacheWrapper(cacheKey, 120, async () => {
//       const workspaces = await WorkspaceQueries.findByUser(userId);

//       // Normalize member_count to a number
//       return workspaces.map((w) => ({
//         ...w,
//         member_count: parseInt(w.member_count || 0, 10),
//       }));
//     });
//   }

//   async getWorkspace(workspaceId, userId) {
//     const workspace = await WorkspaceQueries.findById(workspaceId);
//     if (!workspace) {
//       throw new Error('Workspace not found');
//     }

//     const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
//     if (!access.isOwner && !access.isMember) {
//       throw new Error('You do not have access to this workspace');
//     }

//     return {
//       ...workspace,
//       userRole: access.isOwner ? 'OWNER' : access.role,
//     };
//   }

//   async updateWorkspace(workspaceId, userId, data) {
//     const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
//     if (!isOwner) {
//       throw new Error('Only workspace owner can update workspace');
//     }

//     const workspace = await WorkspaceQueries.update(workspaceId, data);
//     if (!workspace) {
//       throw new Error('Workspace not found');
//     }

//     // Workspace name/description shows in lists + dashboard headers
//     await invalidateCache(
//       buildKey('user', '*', 'workspaces'),
//       buildKey('dashboard', '*', workspaceId)
//     );

//     return workspace;
//   }

//   async deleteWorkspace(workspaceId, userId) {
//     const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
//     if (!isOwner) {
//       throw new Error('Only workspace owner can delete workspace');
//     }

//     const workspace = await WorkspaceQueries.delete(workspaceId);
//     if (!workspace) {
//       throw new Error('Workspace not found');
//     }

//     // Nuke everything related to this workspace
//     await invalidateCache(
//       buildKey('user', '*', 'workspaces'),
//       buildKey('workspace', workspaceId, 'members'),
//       buildKey('workspace', workspaceId, 'members-list'),
//       buildKey('dashboard', '*', workspaceId),
//       buildKey('workspace', workspaceId, 'isowner', '*'),
//       buildKey('workspace', workspaceId, 'ismember', '*'),
//       buildKey('workspace', workspaceId, 'access', '*'),
//       buildKey('workspace', workspaceId, 'role', '*'),
//       buildKey('workspace', workspaceId, 'member-of-user', '*')
//     );

//     return true;
//   }

//   // ─── Member management ─────────────────────────────────────
//   async addMember(workspaceId, userId, email, role = 'MEMBER') {
//     // Permission check
//     const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
//     const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
//     const effectiveRole = isOwner ? 'OWNER' : userRole;

//     if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
//       throw new Error('Only workspace owner or admin can add members');
//     }

//     // Validate role
//     const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
//     if (!validRoles.includes(role)) {
//       throw new Error('Invalid role');
//     }

//     // Fetch workspace ONCE at the top (used in both branches)
//     const workspace = await WorkspaceQueries.findById(workspaceId);
//     if (!workspace) {
//       throw new Error('Workspace not found');
//     }

//     const userToAdd = await UserQueries.findByEmail(email);

//     // ─── Case 1: user exists → add directly ────────────────
//     if (userToAdd) {
//       const isMember = await WorkspaceQueries.isMember(workspaceId, userToAdd.id);
//       if (isMember) {
//         throw new Error('User is already a member of this workspace');
//       }

//       const member = await WorkspaceQueries.addMember(
//         workspaceId,
//         userToAdd.id,
//         role,
//         userId
//       );

//       if (userToAdd.id !== userId) {
//         await notificationService.notifyWorkspaceInvitation({
//           userId: userToAdd.id,
//           actorId: userId,
//           workspaceId,
//           workspaceName: workspace.name,
//         });
//       }

//       // Invalidate all affected caches
//       await this.invalidateMemberCaches(workspaceId, userToAdd.id);
//       // Also invalidate the current user's workspace list
//       await invalidateCache(buildKey('user', userId, 'workspaces'));

//       return {
//         type: 'added',
//         member: {
//           ...member,
//           user: {
//             id: userToAdd.id,
//             name: userToAdd.name,
//             email: userToAdd.email,
//             profile_picture: userToAdd.profile_picture,
//           },
//         },
//       };
//     }

//     // ─── Case 2: user doesn't exist → send invitation ──────
//     const existingInvite = await InvitationQueries.findByEmail(email, workspaceId);
//     if (existingInvite) {
//       throw new Error('An invitation is already pending for this email');
//     }

//     const inviter = await UserQueries.findById(userId);

//     const { token, invitation } = await createWorkspaceInvitationToken({
//       email,
//       role,
//       workspaceId,
//       invitedBy: userId,
//     });

//     try {
//       // await emailService.sendWorkspaceInvitation({
//       //   to: email,
//       //   inviterName: inviter.name,
//       //   workspaceName: workspace.name,
//       //   role,
//       //   token,
//       // });
//       await EmailProducer.queueWorkspaceInvitation({
//         to: email,
//         inviterName: inviter.name,
//         workspaceName: workspace.name,
//         role,
//         token,
//       });
//     } catch (emailError) {
//       console.error('Failed to send invitation email:', emailError.message);
//     }

//     // Invalidate members list + dashboard (invitation count may be shown)
//     await invalidateCache(
//       buildKey('workspace', workspaceId, 'members-list'),
//       buildKey('dashboard', '*', workspaceId)
//     );

//     return {
//       type: 'invited',
//       invitation: {
//         id: invitation.id,
//         email: invitation.email,
//         role: invitation.role,
//         expiresAt: invitation.expires_at,
//       },
//     };
//   }

//   async getPendingInvitations(workspaceId, userId) {
//     const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
//     if (!access.isOwner && access.role !== 'ADMIN') {
//       throw new Error('Only workspace owner or admin can view invitations');
//     }

//     return InvitationQueries.findByWorkspace(workspaceId);
//   }

//   async cancelInvitation(workspaceId, userId, invitationId) {
//     const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
//     if (!access.isOwner && access.role !== 'ADMIN') {
//       throw new Error('Only workspace owner or admin can cancel invitations');
//     }

//     const result = await InvitationQueries.delete(invitationId);
//     if (!result) {
//       throw new Error('Invitation not found');
//     }

//     return true;
//   }

//   async acceptInvitation(token, userId) {
//     const invitation = await InvitationQueries.findByToken(token);
//     if (!invitation) {
//       throw new Error('Invalid or expired invitation');
//     }

//     const user = await UserQueries.findById(userId);
//     if (!user) {
//       throw new Error('User not found');
//     }

//     if (user.email !== invitation.email) {
//       throw new Error('This invitation was sent to a different email address');
//     }

//     const isMember = await WorkspaceQueries.isMember(invitation.workspace_id, userId);
//     if (isMember) {
//       await InvitationQueries.accept(token, userId);
//       throw new Error('You are already a member of this workspace');
//     }

//     await WorkspaceQueries.addMember(
//       invitation.workspace_id,
//       userId,
//       invitation.role,
//       invitation.invited_by
//     );

//     await InvitationQueries.accept(token, userId);

//     // Invalidate all caches for this new member
//     await this.invalidateMemberCaches(invitation.workspace_id, userId);

//     // Notify the inviter
//     const acceptingUser = await UserQueries.findById(userId);
//     if (invitation.invited_by !== userId) {
//       await notificationService.create({
//         type: 'WORKSPACE_INVITATION',
//         content: `${acceptingUser.name} accepted your invitation to "${invitation.workspace_name}"`,
//         data: {
//           workspaceId: invitation.workspace_id,
//           workspaceName: invitation.workspace_name,
//         },
//         userId: invitation.invited_by,
//         actorId: userId,
//       });
//     }

//     return {
//       workspaceId: invitation.workspace_id,
//       workspaceName: invitation.workspace_name,
//       role: invitation.role,
//     };
//   }

//   async getInvitationDetails(token) {
//     const invitation = await InvitationQueries.findByToken(token);
//     if (!invitation) {
//       throw new Error('Invalid or expired invitation');
//     }

//     return {
//       email: invitation.email,
//       role: invitation.role,
//       workspaceName: invitation.workspace_name,
//       inviterName: invitation.inviter_name,
//     };
//   }

//   async updateMemberRole(workspaceId, userId, memberId, role) {
//     const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
//     if (!isOwner) {
//       throw new Error('Only workspace owner can update member roles');
//     }

//     const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
//     if (!validRoles.includes(role)) {
//       throw new Error('Invalid role');
//     }

//     const member = await WorkspaceQueries.findMemberById(workspaceId, memberId);
//     if (!member) {
//       throw new Error('Member not found');
//     }

//     const isOwnerMember = await WorkspaceQueries.isOwner(workspaceId, member.user_id);
//     if (isOwnerMember) {
//       throw new Error('Cannot change owner role');
//     }

//     const updated = await WorkspaceQueries.updateMemberRole(workspaceId, memberId, role);

//     // Invalidate caches for the affected member
//     await this.invalidateMemberCaches(workspaceId, member.user_id);

//     return updated;
//   }

//   async removeMember(workspaceId, userId, memberId) {
//     const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
//     const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
//     const effectiveRole = isOwner ? 'OWNER' : userRole;

//     if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
//       throw new Error('Only workspace owner or admin can remove members');
//     }

//     const member = await WorkspaceQueries.findMemberById(workspaceId, memberId);
//     if (!member) {
//       throw new Error('Member not found');
//     }

//     if (member.user_id === userId) {
//       throw new Error('You cannot remove yourself from the workspace');
//     }

//     const isOwnerMember = await WorkspaceQueries.isOwner(workspaceId, member.user_id);
//     if (isOwnerMember) {
//       throw new Error('Cannot remove workspace owner');
//     }

//     const result = await WorkspaceQueries.removeMemberById(workspaceId, memberId);

//     // Invalidate caches for the removed member
//     await this.invalidateMemberCaches(workspaceId, member.user_id);

//     return result;
//   }

//   async getWorkspaceMembers(workspaceId, userId) {
//     // Access check
//     const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
//     if (!access.isOwner && !access.isMember) {
//       throw new Error('You do not have access to this workspace');
//     }

//     // Delegate to cached query — returns ALL members
//     return WorkspaceQueries.getMembers(workspaceId);
//   }

//   // ─── Helpers ────────────────────────────────────────────────
//   generateSlug(name) {
//     return name
//       .toLowerCase()
//       .trim()
//       .replace(/[^\w\s-]/g, '')
//       .replace(/[\s_-]+/g, '-')
//       .replace(/^-+|-+$/g, '')
//       .substring(0, 60);
//   }

//   async getAllMyTeamMembers(userId) {
//     const rows = await WorkspaceQueries.findAllMembersForUser(userId);

//     const grouped = rows.reduce((acc, row) => {
//       const key = row.workspace_id;
//       if (!acc[key]) {
//         acc[key] = {
//           workspaceId: row.workspace_id,
//           workspaceName: row.workspace_name,
//           members: [],
//         };
//       }
//       acc[key].members.push({
//         memberId: row.member_id,
//         userId: row.user_id,
//         name: row.name,
//         email: row.email,
//         profilePicture: row.profile_picture,
//         jobTitle: row.job_title,
//         role: row.role,
//         joinedAt: row.joined_at,
//       });
//       return acc;
//     }, {});

//     return Object.values(grouped);
//   }
// }

// module.exports = WorkspaceService;


const WorkspaceQueries = require('../db/queries/workspace.queries');
const UserQueries = require('../db/queries/user.queries');
const InvitationQueries = require('../db/queries/invitation.queries');
const { createWorkspaceInvitationToken } = require('../utils/token.utils');
const emailService = require('./email.service');
const NotificationService = require('./notification.service');
const notificationService = new NotificationService();
const { cacheWrapper, invalidateCache, buildKey } = require('../utils/cache.utils');
const EmailProducer = require('../jobs/email.producer');
const logger = require('../config/logger');

class WorkspaceService {
  // ─── Helper: standard member-related cache invalidation ─────
  async invalidateMemberCaches(workspaceId, memberUserId) {
    await invalidateCache(
      buildKey('workspace', workspaceId, 'members'),
      buildKey('workspace', workspaceId, 'members-list'),
      buildKey('workspace', workspaceId, 'access', memberUserId),
      buildKey('workspace', workspaceId, 'ismember', memberUserId),
      buildKey('workspace', workspaceId, 'role', memberUserId),
      buildKey('workspace', workspaceId, 'member-of-user', memberUserId),
      buildKey('user', '*', 'workspaces'),
      buildKey('dashboard', '*', workspaceId)
    );
  }

  // ─── Workspace CRUD ────────────────────────────────────────
  async createWorkspace(userId, data) {
    const { name, description } = data;
    const slug = this.generateSlug(name);

    const existingWorkspace = await WorkspaceQueries.findBySlug(slug);
    if (existingWorkspace) {
      throw new Error('A workspace with this name already exists');
    }

    const workspace = await WorkspaceQueries.create({
      name,
      slug,
      description,
      ownerId: userId,
    });

    await WorkspaceQueries.addMember(workspace.id, userId, 'OWNER', userId);

    await invalidateCache(
      buildKey('user', userId, 'workspaces'),
      buildKey('workspace', workspace.id, 'access', userId),
      buildKey('workspace', workspace.id, 'isowner', userId),
      buildKey('workspace', workspace.id, 'ismember', userId)
    );

    // ✅ Success log
    logger.info('Workspace created', {
      workspaceId: workspace.id,
      userId,
      name,
      slug,
    });

    return workspace;
  }

  async getUserWorkspaces(userId) {
    const cacheKey = buildKey('user', userId, 'workspaces');
    return cacheWrapper(cacheKey, 120, async () => {
      const workspaces = await WorkspaceQueries.findByUser(userId);

      return workspaces.map((w) => ({
        ...w,
        member_count: parseInt(w.member_count || 0, 10),
      }));
    });
  }

  async getWorkspace(workspaceId, userId) {
    const workspace = await WorkspaceQueries.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    if (!access.isOwner && !access.isMember) {
      throw new Error('You do not have access to this workspace');
    }

    return {
      ...workspace,
      userRole: access.isOwner ? 'OWNER' : access.role,
    };
  }

  async updateWorkspace(workspaceId, userId, data) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (!isOwner) {
      throw new Error('Only workspace owner can update workspace');
    }

    const workspace = await WorkspaceQueries.update(workspaceId, data);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await invalidateCache(
      buildKey('user', '*', 'workspaces'),
      buildKey('dashboard', '*', workspaceId)
    );

    // ✅ Success log
    logger.info('Workspace updated', {
      workspaceId,
      userId,
      changes: Object.keys(data),
    });

    return workspace;
  }

  async deleteWorkspace(workspaceId, userId) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (!isOwner) {
      throw new Error('Only workspace owner can delete workspace');
    }

    const workspace = await WorkspaceQueries.delete(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await invalidateCache(
      buildKey('user', '*', 'workspaces'),
      buildKey('workspace', workspaceId, 'members'),
      buildKey('workspace', workspaceId, 'members-list'),
      buildKey('dashboard', '*', workspaceId),
      buildKey('workspace', workspaceId, 'isowner', '*'),
      buildKey('workspace', workspaceId, 'ismember', '*'),
      buildKey('workspace', workspaceId, 'access', '*'),
      buildKey('workspace', workspaceId, 'role', '*'),
      buildKey('workspace', workspaceId, 'member-of-user', '*')
    );

    // ✅ Success log — destructive action worth recording
    logger.info('Workspace deleted', {
      workspaceId,
      userId,
      workspaceName: workspace.name,
    });

    return true;
  }

  // ─── Member management ─────────────────────────────────────
  async addMember(workspaceId, userId, email, role = 'MEMBER') {
    const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    const effectiveRole = isOwner ? 'OWNER' : userRole;

    if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
      throw new Error('Only workspace owner or admin can add members');
    }

    const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const workspace = await WorkspaceQueries.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const userToAdd = await UserQueries.findByEmail(email);

    // ─── Case 1: user exists → add directly ────────────────
    if (userToAdd) {
      const isMember = await WorkspaceQueries.isMember(workspaceId, userToAdd.id);
      if (isMember) {
        throw new Error('User is already a member of this workspace');
      }

      const member = await WorkspaceQueries.addMember(
        workspaceId,
        userToAdd.id,
        role,
        userId
      );

      if (userToAdd.id !== userId) {
        await notificationService.notifyWorkspaceInvitation({
          userId: userToAdd.id,
          actorId: userId,
          workspaceId,
          workspaceName: workspace.name,
        });
      }

      await this.invalidateMemberCaches(workspaceId, userToAdd.id);
      await invalidateCache(buildKey('user', userId, 'workspaces'));

      // ✅ Success log — new member added directly
      logger.info('Member added to workspace', {
        workspaceId,
        addedUserId: userToAdd.id,
        addedByUserId: userId,
        role,
        method: 'direct',
      });

      return {
        type: 'added',
        member: {
          ...member,
          user: {
            id: userToAdd.id,
            name: userToAdd.name,
            email: userToAdd.email,
            profile_picture: userToAdd.profile_picture,
          },
        },
      };
    }

    // ─── Case 2: user doesn't exist → send invitation ──────
    const existingInvite = await InvitationQueries.findByEmail(email, workspaceId);
    if (existingInvite) {
      throw new Error('An invitation is already pending for this email');
    }

    const inviter = await UserQueries.findById(userId);

    const { token, invitation } = await createWorkspaceInvitationToken({
      email,
      role,
      workspaceId,
      invitedBy: userId,
    });

    try {
      await EmailProducer.queueWorkspaceInvitation({
        to: email,
        inviterName: inviter.name,
        workspaceName: workspace.name,
        role,
        token,
      });
    } catch (emailError) {
      // ⚠️ Non-fatal — invitation record exists, just email failed
      logger.warn('Failed to queue workspace invitation email', {
        workspaceId,
        email,
        invitedByUserId: userId,
        error: emailError.message,
      });
    }

    await invalidateCache(
      buildKey('workspace', workspaceId, 'members-list'),
      buildKey('dashboard', '*', workspaceId)
    );

    // ✅ Success log — invitation sent
    logger.info('Workspace invitation sent', {
      workspaceId,
      email,
      role,
      invitedByUserId: userId,
      invitationId: invitation.id,
    });

    return {
      type: 'invited',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
      },
    };
  }

  async getPendingInvitations(workspaceId, userId) {
    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    if (!access.isOwner && access.role !== 'ADMIN') {
      throw new Error('Only workspace owner or admin can view invitations');
    }

    return InvitationQueries.findByWorkspace(workspaceId);
  }

  async cancelInvitation(workspaceId, userId, invitationId) {
    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    if (!access.isOwner && access.role !== 'ADMIN') {
      throw new Error('Only workspace owner or admin can cancel invitations');
    }

    const result = await InvitationQueries.delete(invitationId);
    if (!result) {
      throw new Error('Invitation not found');
    }

    // ✅ Success log
    logger.info('Workspace invitation cancelled', {
      workspaceId,
      invitationId,
      cancelledByUserId: userId,
    });

    return true;
  }

  async acceptInvitation(token, userId) {
    const invitation = await InvitationQueries.findByToken(token);
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    const user = await UserQueries.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.email !== invitation.email) {
      throw new Error('This invitation was sent to a different email address');
    }

    const isMember = await WorkspaceQueries.isMember(invitation.workspace_id, userId);
    if (isMember) {
      await InvitationQueries.accept(token, userId);
      throw new Error('You are already a member of this workspace');
    }

    await WorkspaceQueries.addMember(
      invitation.workspace_id,
      userId,
      invitation.role,
      invitation.invited_by
    );

    await InvitationQueries.accept(token, userId);

    await this.invalidateMemberCaches(invitation.workspace_id, userId);

    // Notify the inviter
    const acceptingUser = await UserQueries.findById(userId);
    if (invitation.invited_by !== userId) {
      try {
        await notificationService.create({
          type: 'WORKSPACE_INVITATION',
          content: `${acceptingUser.name} accepted your invitation to "${invitation.workspace_name}"`,
          data: {
            workspaceId: invitation.workspace_id,
            workspaceName: invitation.workspace_name,
          },
          userId: invitation.invited_by,
          actorId: userId,
        });
      } catch (notifError) {
        // ⚠️ Non-fatal — user is already added, just notification failed
        logger.warn('Failed to notify inviter of acceptance', {
          workspaceId: invitation.workspace_id,
          userId,
          inviterId: invitation.invited_by,
          error: notifError.message,
        });
      }
    }

    // ✅ Success log
    logger.info('Workspace invitation accepted', {
      workspaceId: invitation.workspace_id,
      userId,
      role: invitation.role,
      invitedByUserId: invitation.invited_by,
    });

    return {
      workspaceId: invitation.workspace_id,
      workspaceName: invitation.workspace_name,
      role: invitation.role,
    };
  }

  async getInvitationDetails(token) {
    const invitation = await InvitationQueries.findByToken(token);
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      workspaceName: invitation.workspace_name,
      inviterName: invitation.inviter_name,
    };
  }

  async updateMemberRole(workspaceId, userId, memberId, role) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (!isOwner) {
      throw new Error('Only workspace owner can update member roles');
    }

    const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const member = await WorkspaceQueries.findMemberById(workspaceId, memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const isOwnerMember = await WorkspaceQueries.isOwner(workspaceId, member.user_id);
    if (isOwnerMember) {
      throw new Error('Cannot change owner role');
    }

    const updated = await WorkspaceQueries.updateMemberRole(workspaceId, memberId, role);

    await this.invalidateMemberCaches(workspaceId, member.user_id);

    // ✅ Success log — security-sensitive role change
    logger.info('Member role updated', {
      workspaceId,
      memberUserId: member.user_id,
      changedByUserId: userId,
      newRole: role,
    });

    return updated;
  }

  async removeMember(workspaceId, userId, memberId) {
    const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    const effectiveRole = isOwner ? 'OWNER' : userRole;

    if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
      throw new Error('Only workspace owner or admin can remove members');
    }

    const member = await WorkspaceQueries.findMemberById(workspaceId, memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (member.user_id === userId) {
      throw new Error('You cannot remove yourself from the workspace');
    }

    const isOwnerMember = await WorkspaceQueries.isOwner(workspaceId, member.user_id);
    if (isOwnerMember) {
      throw new Error('Cannot remove workspace owner');
    }

    const result = await WorkspaceQueries.removeMemberById(workspaceId, memberId);

    await this.invalidateMemberCaches(workspaceId, member.user_id);

    // ✅ Success log — sensitive action
    logger.info('Member removed from workspace', {
      workspaceId,
      removedUserId: member.user_id,
      removedByUserId: userId,
    });

    return result;
  }

  async getWorkspaceMembers(workspaceId, userId) {
    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    if (!access.isOwner && !access.isMember) {
      throw new Error('You do not have access to this workspace');
    }

    return WorkspaceQueries.getMembers(workspaceId);
  }

  // ─── Helpers ────────────────────────────────────────────────
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }

  async getAllMyTeamMembers(userId) {
    const rows = await WorkspaceQueries.findAllMembersForUser(userId);

    const grouped = rows.reduce((acc, row) => {
      const key = row.workspace_id;
      if (!acc[key]) {
        acc[key] = {
          workspaceId: row.workspace_id,
          workspaceName: row.workspace_name,
          members: [],
        };
      }
      acc[key].members.push({
        memberId: row.member_id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        profilePicture: row.profile_picture,
        jobTitle: row.job_title,
        role: row.role,
        joinedAt: row.joined_at,
      });
      return acc;
    }, {});

    return Object.values(grouped);
  }
}

module.exports = WorkspaceService;