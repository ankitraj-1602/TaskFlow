const WorkspaceService = require('../services/workspace.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const workspaceService = new WorkspaceService();

class WorkspaceController {
  static async createWorkspace(req, res) {
    try {
      const { name, description } = req.body;
      const userId = req.user.userId;

      const workspace = await workspaceService.createWorkspace(userId, {
        name,
        description,
      });

      successResponse(res, workspace, 'Workspace created successfully', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getUserWorkspaces(req, res) {
    try {
      const userId = req.user.userId;
      const workspaces = await workspaceService.getUserWorkspaces(userId);

      successResponse(res, workspaces, 'Workspaces retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }

  static async getWorkspace(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const workspace = await workspaceService.getWorkspace(id, userId);

      successResponse(res, workspace, 'Workspace retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }

  static async updateWorkspace(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { name, description, logo, settings } = req.body;

      const workspace = await workspaceService.updateWorkspace(id, userId, {
        name,
        description,
        logo,
        settings,
      });

      successResponse(res, workspace, 'Workspace updated successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async deleteWorkspace(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await workspaceService.deleteWorkspace(id, userId);

      successResponse(res, null, 'Workspace deleted successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

static async addMember(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { email, role } = req.body;

    const result = await workspaceService.addMember(id, userId, email, role);

    // Return the FULL result including `type`
    if (result.type === 'added') {
      return successResponse(res, result, 'Member added successfully', 201);
    } else if (result.type === 'invited') {
      return successResponse(res, result, 'Invitation sent successfully', 201);
    } else {
      return successResponse(res, result, 'Operation completed', 201);
    }
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
}

static async getPendingInvitations(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const invitations = await workspaceService.getPendingInvitations(id, userId);
    successResponse(res, invitations, 'Invitations retrieved successfully');
  } catch (error) {
    errorResponse(res, error.message, 403);
  }
}

static async cancelInvitation(req, res) {
  try {
    const { id, invitationId } = req.params;
    const userId = req.user.userId;

    await workspaceService.cancelInvitation(id, userId, invitationId);
    successResponse(res, null, 'Invitation cancelled successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
}

static async acceptInvitation(req, res) {
  try {
    const { token } = req.params;  // ⬅️ from params
    const userId = req.user.userId;

    const result = await workspaceService.acceptInvitation(token, userId);
    successResponse(res, result, 'Invitation accepted successfully');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
}

static async getInvitationDetails(req, res) {
  try {
    const { token } = req.params;
    const details = await workspaceService.getInvitationDetails(token);
    successResponse(res, details, 'Invitation details retrieved');
  } catch (error) {
    errorResponse(res, error.message, 404);
  }
}

  static async removeMember(req, res) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user.userId;

      await workspaceService.removeMember(id, userId, memberId);

      successResponse(res, null, 'Member removed successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async updateMemberRole(req, res) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user.userId;
      const { role } = req.body;

      const member = await workspaceService.updateMemberRole(id, userId, memberId, role);

      successResponse(res, member, 'Member role updated successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getWorkspaceMembers(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const members = await workspaceService.getWorkspaceMembers(id, userId);

      successResponse(res, members, 'Members retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
}

module.exports = WorkspaceController;