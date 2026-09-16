const QueryHelper = require('./helper');

class SearchQueries {
  /**
   * Search across all entity types in a workspace.
   * Only returns items from workspaces the user has access to.
   */
  static async searchAll({ userId, query, workspaceId, limit = 20 }) {
    if (!query || query.trim().length === 0) {
      return { tasks: [], projects: [], comments: [] };
    }

    const tsQuery = this.buildTsQuery(query);

    // ─── Tasks ─────────────────────────────────────
    const tasksQuery = `
      SELECT 
        t.id, t.title, t.description, t.status, t.priority,
        t.project_id, t.due_date, t.created_at,
        p.name as project_name,
        p.workspace_id,
        ts_rank(t.search_vector, $1) as rank,
        ts_headline('english', t.title, $1, 'MaxFragments=1, MaxWords=20, MinWords=5') as highlighted_title,
        ts_headline('english', COALESCE(t.description, ''), $1, 'MaxFragments=2, MaxWords=30, MinWords=10') as highlighted_description
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE t.search_vector @@ $1
        AND t.is_archived = FALSE
        AND p.deleted_at IS NULL
        AND w.deleted_at IS NULL
        AND (w.owner_id = $2 OR wm.user_id = $2)
        ${workspaceId ? 'AND w.id = $3' : ''}
      ORDER BY rank DESC, t.created_at DESC
      LIMIT $${workspaceId ? 4 : 3}
    `;
    const tasksParams = workspaceId
      ? [tsQuery, userId, workspaceId, limit]
      : [tsQuery, userId, limit];
    const tasks = await QueryHelper.query(tasksQuery, tasksParams);

    // ─── Projects ──────────────────────────────────
    const projectsQuery = `
      SELECT 
        p.id, p.name, p.description, p.status,
        p.workspace_id, p.created_at,
        w.name as workspace_name,
        ts_rank(p.search_vector, $1) as rank,
        ts_headline('english', p.name, $1, 'MaxFragments=1, MaxWords=20, MinWords=5') as highlighted_name,
        ts_headline('english', COALESCE(p.description, ''), $1, 'MaxFragments=2, MaxWords=30, MinWords=10') as highlighted_description
      FROM projects p
      JOIN workspaces w ON p.workspace_id = w.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE p.search_vector @@ $1
        AND p.deleted_at IS NULL
        AND w.deleted_at IS NULL
        AND (w.owner_id = $2 OR wm.user_id = $2)
        ${workspaceId ? 'AND w.id = $3' : ''}
      ORDER BY rank DESC, p.created_at DESC
      LIMIT $${workspaceId ? 4 : 3}
    `;
    const projectsParams = workspaceId
      ? [tsQuery, userId, workspaceId, limit]
      : [tsQuery, userId, limit];
    const projects = await QueryHelper.query(projectsQuery, projectsParams);

    // ─── Comments ──────────────────────────────────
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.created_at,
        c.task_id,
        t.title as task_title,
        p.name as project_name,
        p.workspace_id,
        u.name as author_name,
        ts_rank(c.search_vector, $1) as rank,
        ts_headline('english', c.content, $1, 'MaxFragments=2, MaxWords=30, MinWords=10') as highlighted_content
      FROM comments c
      JOIN tasks t ON c.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      JOIN users u ON c.author_id = u.id
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE c.search_vector @@ $1
        AND p.deleted_at IS NULL
        AND w.deleted_at IS NULL
        AND t.is_archived = FALSE
        AND (w.owner_id = $2 OR wm.user_id = $2)
        ${workspaceId ? 'AND w.id = $3' : ''}
      ORDER BY rank DESC, c.created_at DESC
      LIMIT $${workspaceId ? 4 : 3}
    `;
    const commentsParams = workspaceId
      ? [tsQuery, userId, workspaceId, limit]
      : [tsQuery, userId, limit];
    const comments = await QueryHelper.query(commentsQuery, commentsParams);

    return {
      tasks: tasks.rows,
      projects: projects.rows,
      comments: comments.rows,
    };
  }

  /**
   * Convert user query into a tsquery with prefix matching.
   * "auth login" → "auth:* & login:*"
   */
  static buildTsQuery(query) {
    const terms = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => {
        // Escape special chars
        const sanitized = term.replace(/[!&|()<>:*]/g, '');
        return sanitized ? `${sanitized}:*` : '';
      })
      .filter(Boolean);

    return terms.join(' & ');
  }
}

module.exports = SearchQueries;