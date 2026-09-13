const QueryHelper = require('./helper');

class ActivityQueries {
  static async create(activityData) {
    const {
      action,
      changes,
      userId,
      workspaceId,
      projectId,
      taskId,
      commentId,
      ipAddress,
      userAgent,
    } = activityData;

    const query = `
      INSERT INTO activity_logs (
        action, changes, user_id, workspace_id, project_id, task_id, comment_id,
        ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, action, changes, user_id, workspace_id, project_id,
                task_id, comment_id, created_at
    `;
    const result = await QueryHelper.query(query, [
      action,
      changes ? JSON.stringify(changes) : null,
      userId,
      workspaceId || null,
      projectId || null,
      taskId || null,
      commentId || null,
      ipAddress || null,
      userAgent || null,
    ]);
    return result.rows[0];
  }

  /**
   * Base SELECT with joins to users, tasks, projects for rich activity feed.
   */
  static baseSelect() {
    return `
      SELECT
        al.id, al.action, al.changes, al.created_at,
        al.user_id, al.workspace_id, al.project_id, al.task_id, al.comment_id,
        u.name as user_name, u.email as user_email,
        u.profile_picture as user_picture,
        t.title as task_title,
        p.name as project_name,
        w.name as workspace_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN tasks t ON al.task_id = t.id
      LEFT JOIN projects p ON al.project_id = p.id
      LEFT JOIN workspaces w ON al.workspace_id = w.id
    `;
  }

  /**
   * Find activities for a specific task.
   */
  static async findByTask(taskId, options = {}) {
    const conditions = ['al.task_id = $1'];
    const values = [taskId];
    let paramIndex = 2;

    if (options.action) {
      const actions = Array.isArray(options.action)
        ? options.action
        : String(options.action).split(',').map((s) => s.trim());
      if (actions.length === 1) {
        conditions.push(`al.action = $${paramIndex}`);
        values.push(actions[0]);
        paramIndex++;
      } else {
        conditions.push(`al.action = ANY($${paramIndex}::action_type[])`);
        values.push(actions);
        paramIndex++;
      }
    }

    let pagination = '';
    if (options.limit) {
      const limit = parseInt(options.limit);
      const offset = ((parseInt(options.page) || 1) - 1) * limit;
      pagination = ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const query = `
      ${this.baseSelect()}
      WHERE ${conditions.join(' AND ')}
      ORDER BY al.created_at DESC
      ${pagination}
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows;
  }

  /**
   * Find activities for a specific project.
   */
  static async findByProject(projectId, options = {}) {
    const conditions = ['al.project_id = $1'];
    const values = [projectId];
    let paramIndex = 2;

    if (options.action) {
      conditions.push(`al.action = $${paramIndex}`);
      values.push(options.action);
      paramIndex++;
    }

    if (options.userId) {
      conditions.push(`al.user_id = $${paramIndex}`);
      values.push(options.userId);
      paramIndex++;
    }

    let pagination = '';
    if (options.limit) {
      const limit = parseInt(options.limit);
      const offset = ((parseInt(options.page) || 1) - 1) * limit;
      pagination = ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const query = `
      ${this.baseSelect()}
      WHERE ${conditions.join(' AND ')}
      ORDER BY al.created_at DESC
      ${pagination}
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows;
  }

  /**
   * Find activities for a workspace (optionally filtered to project-level only).
   */
  static async findByWorkspace(workspaceId, options = {}) {
    const conditions = ['al.workspace_id = $1'];
    const values = [workspaceId];
    let paramIndex = 2;

    if (options.action) {
      conditions.push(`al.action = $${paramIndex}`);
      values.push(options.action);
      paramIndex++;
    }

    if (options.userId) {
      conditions.push(`al.user_id = $${paramIndex}`);
      values.push(options.userId);
      paramIndex++;
    }

    let pagination = '';
    if (options.limit) {
      const limit = parseInt(options.limit);
      const offset = ((parseInt(options.page) || 1) - 1) * limit;
      pagination = ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const query = `
      ${this.baseSelect()}
      WHERE ${conditions.join(' AND ')}
      ORDER BY al.created_at DESC
      ${pagination}
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows;
  }

  static async countByTask(taskId) {
    const query = `SELECT COUNT(*) as count FROM activity_logs WHERE task_id = $1`;
    const result = await QueryHelper.query(query, [taskId]);
    return parseInt(result.rows[0].count);
  }

  static async countByProject(projectId) {
    const query = `SELECT COUNT(*) as count FROM activity_logs WHERE project_id = $1`;
    const result = await QueryHelper.query(query, [projectId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = ActivityQueries;