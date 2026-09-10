const ProjectQueries = require('../db/queries/project.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');

class ProjectService {
  async createProject(workspaceId, userId, data) {
    // Check if user has access to workspace
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    const userRole = await WorkspaceQueries.getUserRole(workspaceId, userId);
    
    if (!isOwner && !userRole) {
      throw new Error('You do not have access to this workspace');
    }

    // Check if user can create projects (OWNER, ADMIN, MANAGER)
    if (!isOwner && !['ADMIN', 'MANAGER'].includes(userRole)) {
      throw new Error('You do not have permission to create projects');
    }

    const project = await ProjectQueries.create({
      name: data.name,
      description: data.description,
      workspaceId,
      createdById: userId,
      status: data.status || 'PLANNING',
      startDate: data.startDate,
      dueDate: data.dueDate,
    });

    // Add creator as project member
    const workspaceMember = await this.getWorkspaceMember(workspaceId, userId);
    if (workspaceMember) {
      await ProjectQueries.addMember(project.id, workspaceMember.id, 'OWNER');
    }

    return project;
  }

  async getProject(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check workspace access
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this project');
    }

    const stats = await ProjectQueries.getStats(projectId);

    return {
      ...project,
      stats: {
        todo: parseInt(stats.todo_count),
        inProgress: parseInt(stats.in_progress_count),
        review: parseInt(stats.review_count),
        done: parseInt(stats.done_count),
        blocked: parseInt(stats.blocked_count),
        total: parseInt(stats.total_count),
        overdue: parseInt(stats.overdue_count),
      },
    };
  }

  async getWorkspaceProjects(workspaceId, userId, filters = {}) {
    // Check workspace access
    const hasAccess = await this.checkWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this workspace');
    }

    return ProjectQueries.findByWorkspace(workspaceId, filters);
  }

  async updateProject(projectId, userId, data) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permissions
    const isOwner = project.owner_id === userId;
    const isCreator = project.created_by_id === userId;
    const workspaceRole = await WorkspaceQueries.getUserRole(project.workspace_id, userId);

    if (!isOwner && !isCreator && !['OWNER', 'ADMIN', 'MANAGER'].includes(workspaceRole)) {
      throw new Error('You do not have permission to update this project');
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.ownerId !== undefined) updateData.owner_id = data.ownerId;
    if (data.settings !== undefined) updateData.settings = data.settings;

    return ProjectQueries.update(projectId, updateData);
  }

  async deleteProject(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permissions
    const isOwner = project.owner_id === userId;
    const isCreator = project.created_by_id === userId;
    const workspaceRole = await WorkspaceQueries.getUserRole(project.workspace_id, userId);

    if (!isOwner && !isCreator && workspaceRole !== 'OWNER') {
      throw new Error('You do not have permission to delete this project');
    }

    await ProjectQueries.delete(projectId);
    return true;
  }

  async archiveProject(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission');
    }

    return ProjectQueries.archive(projectId);
  }

  async unarchiveProject(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission');
    }

    return ProjectQueries.unarchive(projectId);
  }

  async getProjectMembers(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this project');
    }

    return ProjectQueries.getMembers(projectId);
  }

  async addProjectMember(projectId, userId, memberUserId, role = 'MEMBER') {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permission
    const workspaceRole = await WorkspaceQueries.getUserRole(project.workspace_id, userId);
    const isProjectOwner = project.owner_id === userId;
    
    if (!isProjectOwner && !['OWNER', 'ADMIN', 'MANAGER'].includes(workspaceRole)) {
      throw new Error('You do not have permission to add project members');
    }

    // Get workspace member
    const workspaceMember = await this.getWorkspaceMember(project.workspace_id, memberUserId);
    if (!workspaceMember) {
      throw new Error('User is not a member of the workspace');
    }

    // Check if already a member
    const isMember = await ProjectQueries.isMember(projectId, memberUserId);
    if (isMember) {
      throw new Error('User is already a project member');
    }

    return ProjectQueries.addMember(projectId, workspaceMember.id, role);
  }

  async removeProjectMember(projectId, userId, memberUserId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permission
    const workspaceRole = await WorkspaceQueries.getUserRole(project.workspace_id, userId);
    const isProjectOwner = project.owner_id === userId;

    if (!isProjectOwner && !['OWNER', 'ADMIN'].includes(workspaceRole)) {
      throw new Error('You do not have permission to remove project members');
    }

    // Cannot remove creator
    if (memberUserId === project.created_by_id) {
      throw new Error('Cannot remove project creator');
    }

    const workspaceMember = await this.getWorkspaceMember(project.workspace_id, memberUserId);
    if (!workspaceMember) {
      throw new Error('User is not a workspace member');
    }

    await ProjectQueries.removeMember(projectId, workspaceMember.id);
    return true;
  }

  // Helper methods
  async getWorkspaceMember(workspaceId, userId) {
    const WorkspaceQueries = require('../db/queries/workspace.queries');
    const members = await WorkspaceQueries.getMembers(workspaceId);
    return members.find(m => m.user_id === userId);
  }

  async checkWorkspaceAccess(workspaceId, userId) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (isOwner) return true;
    
    const isMember = await WorkspaceQueries.isMember(workspaceId, userId);
    return isMember;
  }
}

module.exports = ProjectService;