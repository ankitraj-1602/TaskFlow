const LabelQueries = require('../db/queries/label.queries');
const ProjectQueries = require('../db/queries/project.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');
const TaskQueries = require('../db/queries/task.queries');
const { invalidateCache, buildKey } = require('../utils/cache.utils');
const logger = require('../config/logger');

// Color validation — hex only
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

class LabelService {
  /**
   * Create a label in a project. Requires MANAGER+ role.
   */
  async createLabel(projectId, userId, data) {
    const { name, color = '#6366f1' } = data;

    // Validate input
    if (!name || name.trim().length === 0) {
      throw new Error('Label name is required');
    }
    if (name.trim().length > 50) {
      throw new Error('Label name must be 50 characters or less');
    }
    if (!HEX_COLOR.test(color)) {
      throw new Error('Color must be a valid hex code (e.g., #6366f1)');
    }

    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // RBAC: MANAGER, ADMIN, OWNER
    const role = await this.getWorkspaceRole(project.workspace_id, userId);
    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(role)) {
      throw new Error('You do not have permission to create labels');
    }

    // Check duplicate name
    const existing = await LabelQueries.findByName(projectId, name.trim());
    if (existing) {
      throw new Error('A label with this name already exists in this project');
    }

    const label = await LabelQueries.create({
      projectId,
      name: name.trim(),
      color,
      createdById: userId,
    });

    await this.invalidateLabelCaches(project.workspace_id, projectId);

    logger.info('Label created', {
      labelId: label.id,
      projectId,
      workspaceId: project.workspace_id,
      userId,
      name: label.name,
      color: label.color,
    });

    return this.enrichLabel(label);
  }

  /**
   * Get all labels in a project. Any project member can read.
   */
  async getProjectLabels(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this project');
    }

    const labels = await LabelQueries.findByProject(projectId);
    return labels.map((l) => this.enrichLabel(l));
  }

  /**
   * Update a label. Requires MANAGER+.
   */
  async updateLabel(labelId, userId, data) {
    const label = await LabelQueries.findById(labelId);
    if (!label) {
      throw new Error('Label not found');
    }

    const project = await ProjectQueries.findById(label.project_id);
    if (!project) {
      throw new Error('Project not found');
    }

    // RBAC
    const role = await this.getWorkspaceRole(project.workspace_id, userId);
    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(role)) {
      throw new Error('You do not have permission to update labels');
    }

    // Validate
    const updateData = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (trimmed.length === 0 || trimmed.length > 50) {
        throw new Error('Label name must be 1-50 characters');
      }
      // Check duplicate (excluding self)
      const existing = await LabelQueries.findByName(label.project_id, trimmed);
      if (existing && existing.id !== labelId) {
        throw new Error('A label with this name already exists');
      }
      updateData.name = trimmed;
    }
    if (data.color !== undefined) {
      if (!HEX_COLOR.test(data.color)) {
        throw new Error('Color must be a valid hex code');
      }
      updateData.color = data.color;
    }

    const updated = await LabelQueries.update(labelId, updateData);

    await this.invalidateLabelCaches(project.workspace_id, project.id);

    logger.info('Label updated', {
      labelId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
      changes: Object.keys(updateData),
    });

    return this.enrichLabel(updated);
  }

  /**
   * Delete a label. Requires MANAGER+.
   * Cascades to task_labels via FK.
   */
  async deleteLabel(labelId, userId) {
    const label = await LabelQueries.findById(labelId);
    if (!label) {
      throw new Error('Label not found');
    }

    const project = await ProjectQueries.findById(label.project_id);
    if (!project) {
      throw new Error('Project not found');
    }

    // RBAC
    const role = await this.getWorkspaceRole(project.workspace_id, userId);
    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(role)) {
      throw new Error('You do not have permission to delete labels');
    }

    await LabelQueries.delete(labelId);

    await this.invalidateLabelCaches(project.workspace_id, project.id);

    logger.info('Label deleted', {
      labelId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
      name: label.name,
    });

    return true;
  }

  /**
   * Attach a label to a task. Requires MEMBER+.
   */
  async attachLabel(taskId, labelId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const label = await LabelQueries.findById(labelId);
    if (!label) {
      throw new Error('Label not found');
    }

    // Label must belong to the same project as the task
    if (label.project_id !== task.project_id) {
      throw new Error('Label does not belong to this task\'s project');
    }

    const project = await ProjectQueries.findById(task.project_id);

    // RBAC: MEMBER or higher (VIEWER cannot attach)
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this task');
    }

    const role = await this.getWorkspaceRole(project.workspace_id, userId);
    if (role === 'VIEWER') {
      throw new Error('Viewers cannot modify task labels');
    }

    await LabelQueries.attachToTask(taskId, labelId, userId);

    await this.invalidateLabelCaches(project.workspace_id, project.id);

    logger.info('Label attached to task', {
      taskId,
      labelId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
    });

    return true;
  }

  /**
   * Detach a label from a task.
   */
  async detachLabel(taskId, labelId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await ProjectQueries.findById(task.project_id);

    const role = await this.getWorkspaceRole(project.workspace_id, userId);
    if (role === 'VIEWER') {
      throw new Error('Viewers cannot modify task labels');
    }

    await LabelQueries.detachFromTask(taskId, labelId);

    await this.invalidateLabelCaches(project.workspace_id, project.id);

    logger.info('Label detached from task', {
      taskId,
      labelId,
      projectId: project.id,
      workspaceId: project.workspace_id,
      userId,
    });

    return true;
  }

  // ─── Helpers ────────────────────────────────────────
  enrichLabel(row) {
    if (!row) return null;
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      color: row.color,
      createdById: row.created_by_id,
      createdByName: row.created_by_name,
      usageCount: row.usage_count ? parseInt(row.usage_count) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async checkWorkspaceAccess(workspaceId, userId) {
    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    return access.isOwner || access.isMember;
  }

  async getWorkspaceRole(workspaceId, userId) {
    const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
    if (access.isOwner) return 'OWNER';
    return access.role;
  }

  async invalidateLabelCaches(workspaceId, projectId) {
    await invalidateCache(
      buildKey('dashboard', '*', workspaceId),
      buildKey('project', projectId, 'labels')
    );
  }
}

module.exports = LabelService;