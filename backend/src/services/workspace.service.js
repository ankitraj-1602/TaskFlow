const WorkspaceQueries = require('../db/queries/workspace.queries');
const UserQueries = require('../db/queries/user.queries');

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
    if (!['OWNER', 'ADMIN'].includes(userRole)) {
      throw new Error('Only workspace owner or admin can add members');
    }

    // Find user by email
    const userToAdd = await UserQueries.findByEmail(email);
    if (!userToAdd) {
      throw new Error('User not found');
    }

    // Check if already a member
    const isMember = await WorkspaceQueries.isMember(workspaceId, userToAdd.id);
    if (isMember) {
      throw new Error('User is already a member of this workspace');
    }

    // Add member
    const member = await WorkspaceQueries.addMember(
      workspaceId,
      userToAdd.id,
      role,
      userId
    );

    return {
      ...member,
      user: {
        id: userToAdd.id,
        name: userToAdd.name,
        email: userToAdd.email,
        profile_picture: userToAdd.profile_picture,
      },
    };
  }

  async removeMember(workspaceId, userId, memberId) {
    // Check if user is owner or admin
    const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
    if (!['OWNER', 'ADMIN'].includes(userRole)) {
      throw new Error('Only workspace owner or admin can remove members');
    }

    // Check if removing self
    if (userId === memberId) {
      throw new Error('You cannot remove yourself from the workspace');
    }

    // Check if member exists
    const isMember = await WorkspaceQueries.isMember(workspaceId, memberId);
    if (!isMember) {
      throw new Error('User is not a member of this workspace');
    }

    // Check if member is owner
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, memberId);
    if (isOwner) {
      throw new Error('Cannot remove workspace owner');
    }

    await WorkspaceQueries.removeMember(workspaceId, memberId);
    return true;
  }

  async updateMemberRole(workspaceId, userId, memberId, role) {
    // Check if user is owner
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (!isOwner) {
      throw new Error('Only workspace owner can update member roles');
    }

    // Check if member exists
    const isMember = await WorkspaceQueries.isMember(workspaceId, memberId);
    if (!isMember) {
      throw new Error('User is not a member of this workspace');
    }

    // Check if updating owner
    const isOwnerMember = await WorkspaceQueries.isOwner(workspaceId, memberId);
    if (isOwnerMember) {
      throw new Error('Cannot change owner role');
    }

    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const member = await WorkspaceQueries.updateMemberRole(workspaceId, memberId, role);
    return member;
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