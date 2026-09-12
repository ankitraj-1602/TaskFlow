const ProjectService = require('../services/project.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

const projectService = new ProjectService();

class ProjectController {
  static async createProject(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;
      const { name, description, status, startDate, dueDate } = req.body;

      const project = await projectService.createProject(workspaceId, userId, {
        name,
        description,
        status,
        startDate,
        dueDate,
      });

      successResponse(res, project, 'Project created successfully', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getWorkspaceProjects(req, res) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;
      const { status, isArchived, search } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (isArchived !== undefined) filters.isArchived = isArchived === 'true';
      if (search) filters.search = search;

      const projects = await projectService.getWorkspaceProjects(
        workspaceId,
        userId,
        filters
      );

      successResponse(res, projects, 'Projects retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 403);
    }
  }

  static async getProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const project = await projectService.getProject(id, userId);

      successResponse(res, project, 'Project retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }

  static async updateProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { name, description, status, startDate, dueDate, ownerId, settings } = req.body;

      const project = await projectService.updateProject(id, userId, {
        name,
        description,
        status,
        startDate,
        dueDate,
        ownerId,
        settings,
      });

      successResponse(res, project, 'Project updated successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await projectService.deleteProject(id, userId);

      successResponse(res, null, 'Project deleted successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async archiveProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const project = await projectService.archiveProject(id, userId);

      successResponse(res, project, 'Project archived successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async unarchiveProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const project = await projectService.unarchiveProject(id, userId);

      successResponse(res, project, 'Project unarchived successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }

  static async getProjectMembers(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const members = await projectService.getProjectMembers(id, userId);

      successResponse(res, members, 'Project members retrieved successfully');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }

static async addProjectMember(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { email, userId: memberUserId, role } = req.body;

    const member = await projectService.addProjectMember(id, userId, {
      email,
      userId: memberUserId,
      role,
    });

    successResponse(res, member, 'Member added to project successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
}

  static async removeProjectMember(req, res) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user.userId;

      await projectService.removeProjectMember(id, userId, memberId);

      successResponse(res, null, 'Member removed from project successfully');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
  static async getAvailableMembers(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const members = await projectService.getAvailableMembers(id, userId);
    successResponse(res, members, 'Available members retrieved');
  } catch (error) {
    errorResponse(res, error.message, 403);
  }
}
}

module.exports = ProjectController;