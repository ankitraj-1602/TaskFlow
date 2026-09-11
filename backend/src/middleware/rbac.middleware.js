const WorkspaceQueries = require('../db/queries/workspace.queries');
const ProjectQueries = require('../db/queries/project.queries');
const { ROLES, roleAtLeast, hasPermission } = require('../constants/permissions');

/**
 * Middleware: Require user to be a workspace member (any role)
 * Attaches req.workspaceRole and req.workspaceId to the request
 */
const requireWorkspaceMember = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Workspace id can come from params or body
    const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID is required',
      });
    }

    // Check if user is the owner
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (isOwner) {
      req.workspaceId = workspaceId;
      req.workspaceRole = 'OWNER';
      return next();
    }

    // Check if user is a member
    const role = await WorkspaceQueries.getUserRole(workspaceId, userId);
    if (!role) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace',
      });
    }

    req.workspaceId = workspaceId;
    req.workspaceRole = role;
    next();
  } catch (error) {
    console.error('requireWorkspaceMember error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify workspace access',
    });
  }
};

/**
 * Middleware factory: Require user to have one of the specified roles in a workspace
 * Usage: requireWorkspaceRole('ADMIN', 'OWNER')
 */
const requireWorkspaceRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      return res.status(500).json({
        success: false,
        message: 'requireWorkspaceRole must be used after requireWorkspaceMember',
      });
    }

    if (!allowedRoles.includes(req.workspaceRole)) {
      return res.status(403).json({
        success: false,
        message: `You need one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware factory: Require user to have a specific permission in a workspace
 * Usage: requireWorkspacePermission('project:create')
 */
const requireWorkspacePermission = (permission) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      return res.status(500).json({
        success: false,
        message: 'requireWorkspacePermission must be used after requireWorkspaceMember',
      });
    }

    if (!hasPermission(req.workspaceRole, permission)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Middleware: Require user to be a project member
 * Loads project and attaches req.project, req.projectRole, req.workspaceRole
 */
const requireProjectAccess = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const projectId = req.params.projectId || req.params.id;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    // Load project
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check workspace access first
    const isWorkspaceOwner = await WorkspaceQueries.isOwner(project.workspace_id, userId);
    const workspaceRole = isWorkspaceOwner 
      ? 'OWNER' 
      : await WorkspaceQueries.getUserRole(project.workspace_id, userId);

    if (!workspaceRole) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }

    // Get project-level role if any (overrides workspace role if higher)
    // For now, we treat workspace role as authoritative
    // (can be extended later for project-specific roles)

    req.project = project;
    req.projectId = projectId;
    req.workspaceId = project.workspace_id;
    req.workspaceRole = workspaceRole;

    next();
  } catch (error) {
    console.error('requireProjectAccess error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify project access',
    });
  }
};

/**
 * Middleware factory: Require user to have one of the specified roles in a project
 */
const requireProjectRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      return res.status(500).json({
        success: false,
        message: 'requireProjectRole must be used after requireProjectAccess',
      });
    }

    if (!allowedRoles.includes(req.workspaceRole)) {
      return res.status(403).json({
        success: false,
        message: `You need one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  requireWorkspaceMember,
  requireWorkspaceRole,
  requireWorkspacePermission,
  requireProjectAccess,
  requireProjectRole,
};