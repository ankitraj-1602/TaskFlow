const QueryHelper = require('./helper');

class DashboardQueries {
  /**
   * Overall workspace stats — single row.
   */
  static async getWorkspaceStats(workspaceId) {
    const query = `
      WITH project_stats AS (
        SELECT COUNT(*) as total_projects
        FROM projects
        WHERE workspace_id = $1 AND deleted_at IS NULL AND is_archived = FALSE
      ),
      task_stats AS (
        SELECT
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE t.status = 'DONE') as completed_tasks,
          COUNT(*) FILTER (WHERE t.due_date < CURRENT_TIMESTAMP AND t.status != 'DONE') as overdue_tasks,
          COUNT(*) FILTER (WHERE t.status = 'IN_PROGRESS') as in_progress_tasks,
          COUNT(*) FILTER (WHERE t.status = 'TODO') as todo_tasks,
          COUNT(*) FILTER (WHERE t.status = 'REVIEW') as review_tasks,
          COUNT(*) FILTER (WHERE t.status = 'BLOCKED') as blocked_tasks,
          COUNT(*) FILTER (WHERE t.priority = 'URGENT') as urgent_tasks,
          COUNT(*) FILTER (WHERE t.priority = 'HIGH') as high_tasks,
          COUNT(*) FILTER (WHERE t.priority = 'MEDIUM') as medium_tasks,
          COUNT(*) FILTER (WHERE t.priority = 'LOW') as low_tasks
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.workspace_id = $1 
          AND p.deleted_at IS NULL 
          AND p.is_archived = FALSE
          AND t.is_archived = FALSE
      ),
      member_stats AS (
        SELECT COUNT(*) as total_members
        FROM workspace_members
        WHERE workspace_id = $1
      )
      SELECT
        (SELECT total_projects FROM project_stats) as total_projects,
        (SELECT total_members FROM member_stats) as total_members,
        (SELECT total_tasks FROM task_stats) as total_tasks,
        (SELECT completed_tasks FROM task_stats) as completed_tasks,
        (SELECT overdue_tasks FROM task_stats) as overdue_tasks,
        (SELECT in_progress_tasks FROM task_stats) as in_progress_tasks,
        (SELECT todo_tasks FROM task_stats) as todo_tasks,
        (SELECT review_tasks FROM task_stats) as review_tasks,
        (SELECT blocked_tasks FROM task_stats) as blocked_tasks,
        (SELECT urgent_tasks FROM task_stats) as urgent_tasks,
        (SELECT high_tasks FROM task_stats) as high_tasks,
        (SELECT medium_tasks FROM task_stats) as medium_tasks,
        (SELECT low_tasks FROM task_stats) as low_tasks
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return result.rows[0];
  }

  /**
   * Task trends — tasks created and completed per day over the last N days.
   */
  static async getTaskTrends(workspaceId, days = 30) {
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      created AS (
        SELECT
          DATE_TRUNC('day', t.created_at)::date as date,
          COUNT(*) as created_count
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.workspace_id = $1
          AND p.deleted_at IS NULL
          AND t.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', t.created_at)::date
      ),
      completed AS (
        SELECT
          DATE_TRUNC('day', t.completed_at)::date as date,
          COUNT(*) as completed_count
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.workspace_id = $1
          AND p.deleted_at IS NULL
          AND t.completed_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', t.completed_at)::date
      )
      SELECT
        ds.date,
        COALESCE(c.created_count, 0) as created,
        COALESCE(cm.completed_count, 0) as completed
      FROM date_series ds
      LEFT JOIN created c ON c.date = ds.date
      LEFT JOIN completed cm ON cm.date = ds.date
      ORDER BY ds.date ASC
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return result.rows;
  }

  /**
   * Team productivity — per-member task stats.
   */
  static async getTeamProductivity(workspaceId) {
    const query = `
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.profile_picture,
        wm.role,
        COUNT(t.id) FILTER (WHERE t.status = 'DONE') as completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'IN_PROGRESS') as in_progress_tasks,
        COUNT(t.id) FILTER (
          WHERE t.due_date < CURRENT_TIMESTAMP AND t.status != 'DONE'
        ) as overdue_tasks,
        COUNT(t.id) as total_assigned_tasks
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      LEFT JOIN tasks t ON t.assignee_id = wm.id AND t.is_archived = FALSE
      LEFT JOIN projects p ON t.project_id = p.id
        AND p.workspace_id = $1 
        AND p.deleted_at IS NULL
      WHERE wm.workspace_id = $1
      GROUP BY u.id, u.name, u.email, u.profile_picture, wm.role
      ORDER BY completed_tasks DESC, u.name ASC
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return result.rows;
  }

  /**
   * Project progress — completion % per project.
   */
  static async getProjectProgress(workspaceId) {
    const query = `
      SELECT
        p.id,
        p.name,
        p.status,
        p.due_date,
        COUNT(t.id) FILTER (WHERE t.is_archived = FALSE) as total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'DONE' AND t.is_archived = FALSE) as completed_tasks,
        COUNT(t.id) FILTER (
          WHERE t.due_date < CURRENT_TIMESTAMP 
          AND t.status != 'DONE' 
          AND t.is_archived = FALSE
        ) as overdue_tasks,
        CASE
          WHEN COUNT(t.id) FILTER (WHERE t.is_archived = FALSE) = 0 THEN 0
          ELSE ROUND(
            (COUNT(t.id) FILTER (WHERE t.status = 'DONE' AND t.is_archived = FALSE)::numeric 
            / COUNT(t.id) FILTER (WHERE t.is_archived = FALSE)) * 100
          )
        END as completion_percentage
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.workspace_id = $1 
        AND p.deleted_at IS NULL 
        AND p.is_archived = FALSE
      GROUP BY p.id, p.name, p.status, p.due_date
      ORDER BY completion_percentage DESC, p.name ASC
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return result.rows;
  }

  /**
   * Overdue breakdown by assignee.
   */
  static async getOverdueBreakdown(workspaceId) {
    const query = `
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.profile_picture,
        COUNT(t.id) as overdue_count,
        MIN(t.due_date) as oldest_overdue
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN workspace_members wm ON t.assignee_id = wm.id
      JOIN users u ON wm.user_id = u.id
      WHERE p.workspace_id = $1
        AND p.deleted_at IS NULL
        AND t.is_archived = FALSE
        AND t.status != 'DONE'
        AND t.due_date < CURRENT_TIMESTAMP
      GROUP BY u.id, u.name, u.email, u.profile_picture
      HAVING COUNT(t.id) > 0
      ORDER BY overdue_count DESC, u.name ASC
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return result.rows;
  }

  /**
   * Recent activity count for the dashboard.
   */
  static async getRecentActivityCount(workspaceId, hours = 24) {
    const query = `
      SELECT COUNT(*) as count
      FROM activity_logs
      WHERE workspace_id = $1
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = DashboardQueries;