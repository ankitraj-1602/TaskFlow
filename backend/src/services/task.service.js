const TaskQueries = require('../db/queries/task.queries');
const ProjectQueries = require('../db/queries/project.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');

class TaskService {
  async createTask(projectId, userId, data) {
  const project = await ProjectQueries.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const hasAccess = await this.checkProjectAccess(project, userId);
  if (!hasAccess) {
    throw new Error('You do not have access to this project');
  }

  // Convert user_id to workspace_member_id if assignee provided
  let workspaceMemberId = null;
  if (data.assigneeId) {
    const members = await WorkspaceQueries.getMembers(project.workspace_id);
    const workspaceMember = members.find(m => m.user_id === data.assigneeId);
    if (!workspaceMember) {
      throw new Error('Assignee is not a member of this workspace');
    }
    workspaceMemberId = workspaceMember.id;
  }

  const task = await TaskQueries.create({
    title: data.title,
    description: data.description,
    status: data.status || 'TODO',
    priority: data.priority || 'MEDIUM',
    dueDate: data.dueDate,
    storyPoints: data.storyPoints,
    projectId,
    createdById: userId,
    assigneeId: workspaceMemberId,
    reporterId: userId,
    metadata: data.metadata,
  });

  return this.enrichTask(task);
}
  async getTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this task');
    }

    return this.enrichTask(task);
  }

  async getProjectTasks(projectId, userId, filters = {}) {
    // Verify project exists and user has access
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this project');
    }

    const tasks = await TaskQueries.findByProject(projectId, filters);

    // If pagination is requested, return with count
    if (filters.limit) {
      const total = await TaskQueries.countByProject(projectId, filters);
      return {
        data: tasks.map(this.enrichTask),
        total,
        page: parseInt(filters.page) || 1,
        limit: parseInt(filters.limit),
      };
    }

    return tasks.map(this.enrichTask);
  }

 async updateTask(taskId, userId, data) {
  const task = await TaskQueries.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const project = await ProjectQueries.findById(task.project_id);
  const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
  if (!hasAccess) {
    throw new Error('You do not have access to this task');
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
  if (data.storyPoints !== undefined) updateData.story_points = data.storyPoints;
  if (data.metadata !== undefined) updateData.metadata = data.metadata;

  // Handle assignee
  if (data.assigneeId !== undefined) {
    if (data.assigneeId === null) {
      updateData.assignee_id = null;
    } else {
      const members = await WorkspaceQueries.getMembers(project.workspace_id);
      const workspaceMember = members.find(m => m.user_id === data.assigneeId);
      if (!workspaceMember) {
        throw new Error('Assignee is not a member of this workspace');
      }
      updateData.assignee_id = workspaceMember.id;
    }
  }

  const updated = await TaskQueries.update(taskId, updateData);
  return this.enrichTask(updated);
}
  async updateTaskStatus(taskId, userId, status, position) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this task');
    }

    const updated = await TaskQueries.updateStatus(taskId, status, position);
    return this.enrichTask(updated);
  }

  async reorderTasks(projectId, userId, status, taskIds) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this project');
    }

    await TaskQueries.reorderTasks(projectId, status, taskIds);
    return true;
  }

  async deleteTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this task');
    }

    await TaskQueries.delete(taskId);
    return true;
  }

  async archiveTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this task');
    }

    return TaskQueries.archive(taskId);
  }

  async unarchiveTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this task');
    }

    return TaskQueries.unarchive(taskId);
  }

  async duplicateTask(taskId, userId) {
    const task = await TaskQueries.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await ProjectQueries.findById(task.project_id);
    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this task');
    }

    const duplicated = await TaskQueries.duplicate(taskId, userId);
    return this.enrichTask(duplicated);
  }

  async getTaskStats(projectId, userId) {
    const project = await ProjectQueries.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this project');
    }

    const stats = await TaskQueries.getStatsByProject(projectId);

    return {
      total: parseInt(stats.total),
      byStatus: {
        todo: parseInt(stats.todo),
        inProgress: parseInt(stats.in_progress),
        review: parseInt(stats.review),
        done: parseInt(stats.done),
        blocked: parseInt(stats.blocked),
      },
      byPriority: {
        urgent: parseInt(stats.urgent),
        high: parseInt(stats.high),
        medium: parseInt(stats.medium),
        low: parseInt(stats.low),
      },
      overdue: parseInt(stats.overdue),
    };
  }

  async getMyTasks(userId, filters = {}) {
    const tasks = await TaskQueries.getMyTasks(userId, filters);
    return tasks.map(this.enrichTask);
  }

  // Helper methods
enrichTask(task) {
  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
    storyPoints: task.story_points,
    position: task.position,
    isArchived: task.is_archived,
    metadata: task.metadata,
    projectId: task.project_id,
    projectName: task.project_name,
    workspaceId: task.workspace_id,
    createdById: task.created_by_id,
    createdByName: task.created_by_name,
    assigneeId: task.assignee_id,              // workspace_member_id
    assigneeUserId: task.assignee_user_id,     // user_id (need to add to query)
    assigneeName: task.assignee_name,
    assigneePicture: task.assignee_picture,
    reporterId: task.reporter_id,
    reporterName: task.reporter_name,
    commentCount: parseInt(task.comment_count || 0),
    attachmentCount: parseInt(task.attachment_count || 0),
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    completedAt: task.completed_at,
  };
}

  async checkWorkspaceAccess(workspaceId, userId) {
    const isOwner = await WorkspaceQueries.isOwner(workspaceId, userId);
    if (isOwner) return true;
    return WorkspaceQueries.isMember(workspaceId, userId);
  }

  async checkProjectAccess(project, userId) {
    return this.checkWorkspaceAccess(project.workspace_id, userId);
  }

  async getWorkspaceMember(workspaceId, userId) {
    const members = await WorkspaceQueries.getMembers(workspaceId);
    return members.find(m => m.user_id === userId);
  }
}

module.exports = TaskService;