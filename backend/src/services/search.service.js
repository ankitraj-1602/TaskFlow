const SearchQueries = require('../db/queries/search.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');

class SearchService {
  async search(userId, { query, workspaceId, limit = 20 }) {
    if (!query || query.trim().length === 0) {
      return { tasks: [], projects: [], comments: [], total: 0 };
    }

    // If workspaceId given, verify user has access
    if (workspaceId) {
      const access = await WorkspaceQueries.getWorkspaceAccess(
        workspaceId,
        userId
      );
      if (!access.isOwner && !access.isMember) {
        throw new Error('You do not have access to this workspace');
      }
    }

    const results = await SearchQueries.searchAll({
      userId,
      query,
      workspaceId,
      limit,
    });

    // Enrich + normalize
    const tasks = results.tasks.map(this.enrichTask);
    const projects = results.projects.map(this.enrichProject);
    const comments = results.comments.map(this.enrichComment);

    return {
      tasks,
      projects,
      comments,
      total: tasks.length + projects.length + comments.length,
    };
  }

  enrichTask(row) {
    return {
      id: row.id,
      type: 'task',
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      projectId: row.project_id,
      projectName: row.project_name,
      workspaceId: row.workspace_id,
      dueDate: row.due_date,
      createdAt: row.created_at,
      rank: parseFloat(row.rank),
      highlightedTitle: row.highlighted_title,
      highlightedDescription: row.highlighted_description,
    };
  }

  enrichProject(row) {
    return {
      id: row.id,
      type: 'project',
      name: row.name,
      description: row.description,
      status: row.status,
      workspaceId: row.workspace_id,
      workspaceName: row.workspace_name,
      createdAt: row.created_at,
      rank: parseFloat(row.rank),
      highlightedName: row.highlighted_name,
      highlightedDescription: row.highlighted_description,
    };
  }

  enrichComment(row) {
    return {
      id: row.id,
      type: 'comment',
      content: row.content,
      taskId: row.task_id,
      taskTitle: row.task_title,
      projectName: row.project_name,
      workspaceId: row.workspace_id,
      authorName: row.author_name,
      createdAt: row.created_at,
      rank: parseFloat(row.rank),
      highlightedContent: row.highlighted_content,
    };
  }
}

module.exports = SearchService;