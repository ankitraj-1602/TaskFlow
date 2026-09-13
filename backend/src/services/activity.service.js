const ActivityQueries = require('../db/queries/activity.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');
const ProjectQueries = require('../db/queries/project.queries');
const TaskQueries = require('../db/queries/task.queries');

class ActivityService {
  async log(data) {
    try {
      const created = await ActivityQueries.create(data);
      return created;
    } catch (error) {
      console.error('⚠️ Activity log failed:', error.message);
      return null;
    }
  }

  async getTaskActivities(taskId, userId, options = {}) {
    const task = await TaskQueries.findById(taskId);
    if (!task) throw new Error('Task not found');

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(
      project.workspace_id,
      userId
    );
    if (!hasAccess) throw new Error('You do not have access to this task');

    const activities = await ActivityQueries.findByTask(taskId, options);
    return activities.map((a) => this.enrichActivity(a));
  }

  async getProjectActivities(projectId, userId, options = {}) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) throw new Error('Project not found');

    const hasAccess = await this.checkWorkspaceAccess(
      project.workspace_id,
      userId
    );
    if (!hasAccess) throw new Error('You do not have access to this project');

    const activities = await ActivityQueries.findByProject(projectId, options);
    return activities.map((a) => this.enrichActivity(a));
  }

  async getWorkspaceActivities(workspaceId, userId, options = {}) {
    const hasAccess = await this.checkWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) throw new Error('You do not have access to this workspace');

    const activities = await ActivityQueries.findByWorkspace(
      workspaceId,
      options
    );
    return activities.map((a) => this.enrichActivity(a));
  }

  // ─── Helpers ───────────────────────────────────────
  enrichActivity(row) {
    return {
      id: row.id,
      action: row.action,
      changes: row.changes,
      createdAt: row.created_at,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      userPicture: row.user_picture,
      workspaceId: row.workspace_id,
      workspaceName: row.workspace_name,
      projectId: row.project_id,
      projectName: row.project_name,
      taskId: row.task_id,
      taskTitle: row.task_title,
      commentId: row.comment_id,
      description: this.buildDescription(row),
    };
  }

  buildDescription(row) {
    const actor = row.user_name || 'Someone';
    const task = row.task_title ? `"${row.task_title}"` : 'a task';
    const changes = row.changes || {};

    switch (row.action) {
      case 'CREATED':
        return `${actor} created ${task}`;
      case 'UPDATED':
        return `${actor} updated ${task}`;
      case 'DELETED':
        return `${actor} deleted ${task}`;
      case 'ASSIGNED':
        return `${actor} assigned ${task}`;
      case 'REASSIGNED':
        return `${actor} reassigned ${task}`;
      case 'STATUS_CHANGED':
        return `${actor} changed status of ${task} from ${changes.from || '?'} to ${changes.to || '?'}`;
      case 'PRIORITY_CHANGED':
        return `${actor} changed priority of ${task} from ${changes.from || '?'} to ${changes.to || '?'}`;
      case 'MOVED':
        return `${actor} moved ${task} from ${changes.from || '?'} to ${changes.to || '?'}`;
      case 'COMPLETED':
        return `${actor} completed ${task}`;
      case 'ARCHIVED':
        return `${actor} archived ${task}`;
      case 'RESTORED':
        return `${actor} restored ${task}`;
      case 'COMMENTED':
        return `${actor} commented on ${task}`;
      case 'MENTIONED':
        return `${actor} mentioned someone in a comment on ${task}`;
      case 'ATTACHED':
        return `${actor} attached a file to ${task}`;
      default:
        return `${actor} performed ${row.action} on ${task}`;
    }
  }

  async checkWorkspaceAccess(workspaceId, userId) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (isOwner) return true;
    return WorkspaceQueries.isMember(workspaceId, userId);
  }
}

module.exports = ActivityService;