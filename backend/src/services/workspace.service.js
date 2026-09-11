const WorkspaceQueries = require('../db/queries/workspace.queries');
const UserQueries = require('../db/queries/user.queries');
const InvitationQueries = require('../db/queries/invitation.queries'); 
const { createWorkspaceInvitationToken } = require('../utils/token.utils');
const emailService = require('./email.service');

class WorkspaceService {
  async createWorkspace(userId, data) {
    const { name, description } = data;

    // Generate slug from name
    const slug = this.generateSlug(name);

    // Check if slug exists
    const existingWorkspace = await WorkspaceQueries.findBySlug(slug);
    if (existingWorkspace) {
      throw new Error('A workspace with this name already exists');
    }

    // Create workspace
    const workspace = await WorkspaceQueries.create({
      name,
      slug,
      description,
      ownerId: userId,
    });

    // Add owner as member with OWNER role
    await WorkspaceQueries.addMember(workspace.id, userId, 'OWNER', userId);

    return workspace;
  }

  async getUserWorkspaces(userId) {
    return WorkspaceQueries.findByUser(userId);
  }

  async getWorkspace(workspaceId, userId) {
    const workspace = await WorkspaceQueries.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if user has access
    const isMember = await WorkspaceQueries.isMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;

    if (!isMember && !isOwner) {
      throw new Error('You do not have access to this workspace');
    }

    // Get user's role
    const role = await WorkspaceQueries.getUserRole(workspaceId, userId);
    
    return {
      ...workspace,
      userRole: isOwner ? 'OWNER' : role,
    };
  }

  async updateWorkspace(workspaceId, userId, data) {
    // Check if user is owner
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (!isOwner) {
      throw new Error('Only workspace owner can update workspace');
    }

    const workspace = await WorkspaceQueries.update(workspaceId, data);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return workspace;
  }

  async deleteWorkspace(workspaceId, userId) {
    // Check if user is owner
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (!isOwner) {
      throw new Error('Only workspace owner can delete workspace');
    }

    const workspace = await WorkspaceQueries.delete(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return true;
  }

async addMember(workspaceId, userId, email, role = 'MEMBER') {
    // Check if user is owner or admin
    const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    const effectiveRole = isOwner ? 'OWNER' : userRole;

    if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
      throw new Error('Only workspace owner or admin can add members');
    }

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    // Find user by email
    const userToAdd = await UserQueries.findByEmail(email);

    // If user exists → add them directly
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

    // User doesn't exist → create invitation
    const existingInvite = await InvitationQueries.findByEmail(email, workspaceId);
    if (existingInvite) {
      throw new Error('An invitation is already pending for this email');
    }

    const workspace = await WorkspaceQueries.findById(workspaceId);
    const inviter = await UserQueries.findById(userId);

    const { token, invitation } = await createWorkspaceInvitationToken({
      email,
      role,
      workspaceId,
      invitedBy: userId,
    });

    // Send invitation email
    try {
      await emailService.sendWorkspaceInvitation({
        to: email,
        inviterName: inviter.name,
        workspaceName: workspace.name,
        role,
        token,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError.message);
    }

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
    const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    const effectiveRole = isOwner ? 'OWNER' : userRole;

    if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
      throw new Error('Only workspace owner or admin can view invitations');
    }

    return InvitationQueries.findByWorkspace(workspaceId);
  }

  async cancelInvitation(workspaceId, userId, invitationId) {
    const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    const effectiveRole = isOwner ? 'OWNER' : userRole;

    if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
      throw new Error('Only workspace owner or admin can cancel invitations');
    }

    const result = await InvitationQueries.delete(invitationId);
    if (!result) {
      throw new Error('Invitation not found');
    }

    return true;
  }

  async acceptInvitation(token, userId) {
    const invitation = await InvitationQueries.findByToken(token);
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Get user
    const user = await UserQueries.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email matches
    if (user.email !== invitation.email) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Check if already a member
    const isMember = await WorkspaceQueries.isMember(invitation.workspace_id, userId);
    if (isMember) {
      // Mark invitation as accepted anyway
      await InvitationQueries.accept(token, userId);
      throw new Error('You are already a member of this workspace');
    }

    // Add as member
    await WorkspaceQueries.addMember(
      invitation.workspace_id,
      userId,
      invitation.role,
      invitation.invited_by
    );

    // Mark invitation as accepted
    await InvitationQueries.accept(token, userId);

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

//   async removeMember(workspaceId, userId, memberId) {
//     // Check if user is owner or admin
//     const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
//     if (!['OWNER', 'ADMIN'].includes(userRole)) {
//       throw new Error('Only workspace owner or admin can remove members');
//     }

//     // Check if removing self
//     if (userId === memberId) {
//       throw new Error('You cannot remove yourself from the workspace');
//     }

//     // Check if member exists
//     const isMember = await WorkspaceQueries.isMember(workspaceId, memberId);
//     if (!isMember) {
//       throw new Error('User is not a member of this workspace');
//     }

//     // Check if member is owner
//     const isOwner = await WorkspaceQueries.isOwner(workspaceId, memberId);
//     if (isOwner) {
//       throw new Error('Cannot remove workspace owner');
//     }

//     await WorkspaceQueries.removeMember(workspaceId, memberId);
//     return true;
//   }

async updateMemberRole(workspaceId, userId, memberId, role) {
  // Check if current user is OWNER
  const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
  if (!isOwner) {
    throw new Error('Only workspace owner can update member roles');
  }

  // Validate role
  const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
  if (!validRoles.includes(role)) {
    throw new Error('Invalid role');
  }

  // Find member by workspace_members.id
  const member = await WorkspaceQueries.findMemberById(workspaceId, memberId);
  if (!member) {
    throw new Error('Member not found');
  }

  // Check if updating the owner
  const isOwnerMember = await WorkspaceQueries.isOwner(workspaceId, member.user_id);
  if (isOwnerMember) {
    throw new Error('Cannot change owner role');
  }

  const updated = await WorkspaceQueries.updateMemberRole(workspaceId, memberId, role);
  return updated;
}

async removeMember(workspaceId, userId, memberId) {
  // Check if current user is owner or admin
  const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
  const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
  const effectiveRole = isOwner ? 'OWNER' : userRole;

  if (!['OWNER', 'ADMIN'].includes(effectiveRole)) {
    throw new Error('Only workspace owner or admin can remove members');
  }

  // Find member by workspace_members.id
  const member = await WorkspaceQueries.findMemberById(workspaceId, memberId);
  if (!member) {
    throw new Error('Member not found');
  }

  // Check if removing self
  if (member.user_id === userId) {
    throw new Error('You cannot remove yourself from the workspace');
  }

  // Check if removing the owner
  const isOwnerMember = await WorkspaceQueries.isOwner(workspaceId, member.user_id);
  if (isOwnerMember) {
    throw new Error('Cannot remove workspace owner');
  }

return WorkspaceQueries.removeMemberById(workspaceId, memberId);
}

  async getWorkspaceMembers(workspaceId, userId) {
    // Check if user has access
    const isMember = await WorkspaceQueries.isMember(workspaceId, userId);
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    
    if (!isMember && !isOwner) {
      throw new Error('You do not have access to this workspace');
    }

    return WorkspaceQueries.getMembers(workspaceId);
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }
}

module.exports = WorkspaceService;