// const WorkspaceQueries = require('../db/queries/workspace.queries');
// const ProjectQueries = require('../db/queries/project.queries');
// const { ROLES, roleAtLeast, hasPermission } = require('../constants/permissions');

// /**
//  * Middleware: Require user to be a workspace member (any role)
//  * Attaches req.workspaceRole and req.workspaceId to the request
//  */
// const requireWorkspaceMember = async (req, res, next) => {
//   try {
//     const userId = req.user?.userId;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: 'Authentication required' });
//     }

//     const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
//     if (!workspaceId) {
//       return res.status(400).json({ success: false, message: 'Workspace ID is required' });
//     }

//     // ⬇️ Single cache lookup
//     const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);

//     if (!access.isOwner && !access.isMember) {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not a member of this workspace',
//       });
//     }

//     req.workspaceId = workspaceId;
//     req.workspaceRole = access.isOwner ? 'OWNER' : access.role;
//     next();
//   } catch (error) {
//     console.error('requireWorkspaceMember error:', error);
//     return res.status(500).json({ success: false, message: 'Failed to verify workspace access' });
//   }
// };

// /**
//  * Middleware factory: Require user to have one of the specified roles in a workspace
//  * Usage: requireWorkspaceRole('ADMIN', 'OWNER')
//  */
// const requireWorkspaceRole = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.workspaceRole) {
//       return res.status(500).json({
//         success: false,
//         message: 'requireWorkspaceRole must be used after requireWorkspaceMember',
//       });
//     }

//     if (!allowedRoles.includes(req.workspaceRole)) {
//       return res.status(403).json({
//         success: false,
//         message: `You need one of these roles: ${allowedRoles.join(', ')}`,
//       });
//     }

//     next();
//   };
// };

// /**
//  * Middleware factory: Require user to have a specific permission in a workspace
//  * Usage: requireWorkspacePermission('project:create')
//  */
// const requireWorkspacePermission = (permission) => {
//   return (req, res, next) => {
//     if (!req.workspaceRole) {
//       return res.status(500).json({
//         success: false,
//         message: 'requireWorkspacePermission must be used after requireWorkspaceMember',
//       });
//     }

//     if (!hasPermission(req.workspaceRole, permission)) {
//       return res.status(403).json({
//         success: false,
//         message: `You don't have permission to: ${permission}`,
//       });
//     }

//     next();
//   };
// };

// /**
//  * Middleware: Require user to be a project member
//  * Loads project and attaches req.project, req.projectRole, req.workspaceRole
//  */
// const requireProjectAccess = async (req, res, next) => {
//   try {
//     const userId = req.user?.userId;
//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required',
//       });
//     }

//     const projectId = req.params.projectId || req.params.id;
//     if (!projectId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Project ID is required',
//       });
//     }

//     const project = await ProjectQueries.findById(projectId);
//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found',
//       });
//     }

//     // ⬇️ Single cache lookup
//     const access = await WorkspaceQueries.getWorkspaceAccess(
//       project.workspace_id,
//       userId
//     );

//     if (!access.isOwner && !access.isMember) {
//       return res.status(403).json({
//         success: false,
//         message: 'You do not have access to this project',
//       });
//     }

//     req.project = project;
//     req.projectId = projectId;
//     req.workspaceId = project.workspace_id;
//     req.workspaceRole = access.isOwner ? 'OWNER' : access.role;

//     next();
//   } catch (error) {
//     console.error('requireProjectAccess error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to verify project access',
//     });
//   }
// };

// /**
//  * Middleware factory: Require user to have one of the specified roles in a project
//  */
// const requireProjectRole = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.workspaceRole) {
//       return res.status(500).json({
//         success: false,
//         message: 'requireProjectRole must be used after requireProjectAccess',
//       });
//     }

//     if (!allowedRoles.includes(req.workspaceRole)) {
//       return res.status(403).json({
//         success: false,
//         message: `You need one of these roles: ${allowedRoles.join(', ')}`,
//       });
//     }

//     next();
//   };
// };

// module.exports = {
//   requireWorkspaceMember,
//   requireWorkspaceRole,
//   requireWorkspacePermission,
//   requireProjectAccess,
//   requireProjectRole,
// };



const WorkspaceQueries = require('../db/queries/workspace.queries');
const ProjectQueries = require('../db/queries/project.queries');
const { ROLES, roleAtLeast, hasPermission } = require('../constants/permissions');
const logger = require('../config/logger');

/**
 * Middleware: Require user to be a workspace member (any role)
 */
const requireWorkspaceMember = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required' });
    }

    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);

    if (!access.isOwner && !access.isMember) {
      // ⚠️ RBAC denial — log with context
      logger.warn('RBAC denied: not a workspace member', {
        correlationId: req.correlationId,
        userId,
        workspaceId,
        url: req.originalUrl,
        method: req.method,
      });

      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace',
      });
    }

    req.workspaceId = workspaceId;
    req.workspaceRole = access.isOwner ? 'OWNER' : access.role;
    next();
  } catch (error) {
    // ❌ Unexpected error
    logger.error('requireWorkspaceMember error', {
      correlationId: req.correlationId,
      userId: req.user?.userId,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({ success: false, message: 'Failed to verify workspace access' });
  }
};

/**
 * Middleware factory: Require user to have one of the specified roles in a workspace
 */
const requireWorkspaceRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      logger.error('requireWorkspaceRole used without requireWorkspaceMember', {
        correlationId: req.correlationId,
        url: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'requireWorkspaceRole must be used after requireWorkspaceMember',
      });
    }

    if (!allowedRoles.includes(req.workspaceRole)) {
      logger.warn('RBAC denied: insufficient workspace role', {
        correlationId: req.correlationId,
        userId: req.user?.userId,
        workspaceId: req.workspaceId,
        currentRole: req.workspaceRole,
        requiredRoles: allowedRoles,
        url: req.originalUrl,
        method: req.method,
      });

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
 */
const requireWorkspacePermission = (permission) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      logger.error('requireWorkspacePermission used without requireWorkspaceMember', {
        correlationId: req.correlationId,
        url: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'requireWorkspacePermission must be used after requireWorkspaceMember',
      });
    }

    if (!hasPermission(req.workspaceRole, permission)) {
      logger.warn('RBAC denied: missing workspace permission', {
        correlationId: req.correlationId,
        userId: req.user?.userId,
        workspaceId: req.workspaceId,
        currentRole: req.workspaceRole,
        requiredPermission: permission,
        url: req.originalUrl,
        method: req.method,
      });

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

    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const access = await WorkspaceQueries.getWorkspaceAccess(
      project.workspace_id,
      userId
    );

    if (!access.isOwner && !access.isMember) {
      // ⚠️ RBAC denial
      logger.warn('RBAC denied: no access to project', {
        correlationId: req.correlationId,
        userId,
        projectId,
        workspaceId: project.workspace_id,
        url: req.originalUrl,
        method: req.method,
      });

      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project',
      });
    }

    req.project = project;
    req.projectId = projectId;
    req.workspaceId = project.workspace_id;
    req.workspaceRole = access.isOwner ? 'OWNER' : access.role;

    next();
  } catch (error) {
    // ❌ Unexpected error
    logger.error('requireProjectAccess error', {
      correlationId: req.correlationId,
      userId: req.user?.userId,
      projectId: req.params.projectId || req.params.id,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
    });

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
      logger.error('requireProjectRole used without requireProjectAccess', {
        correlationId: req.correlationId,
        url: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'requireProjectRole must be used after requireProjectAccess',
      });
    }

    if (!allowedRoles.includes(req.workspaceRole)) {
      logger.warn('RBAC denied: insufficient project role', {
        correlationId: req.correlationId,
        userId: req.user?.userId,
        projectId: req.projectId,
        currentRole: req.workspaceRole,
        requiredRoles: allowedRoles,
        url: req.originalUrl,
        method: req.method,
      });

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