const QueryHelper = require('./helper');

class TaskQueries {
  static async create(taskData) {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      storyPoints,
      projectId,
      createdById,
      assigneeId,
      reporterId,
      metadata,
    } = taskData;

    // Get max position for the status column
    const positionResult = await QueryHelper.query(
      `SELECT COALESCE(MAX(position), 0) + 1 as next_position 
       FROM tasks 
       WHERE project_id = $1 AND status = $2 AND is_archived = FALSE`,
      [projectId, status || 'TODO']
    );
    const position = positionResult.rows[0].next_position;

    const query = `
      INSERT INTO tasks (
        title, description, status, priority, due_date, story_points,
        position, project_id, created_by_id, assignee_id, reporter_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, description, status, priority, due_date, story_points,
                position, is_archived, metadata, project_id, created_by_id,
                assignee_id, reporter_id, created_at, updated_at, completed_at
    `;
    const result = await QueryHelper.query(query, [
      title,
      description,
      status || 'TODO',
      priority || 'MEDIUM',
      dueDate,
      storyPoints,
      position,
      projectId,
      createdById,
      assigneeId,
      reporterId || createdById,
      metadata,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT t.*,
        u.name as created_by_name, u.email as created_by_email,
        a.name as assignee_name, a.email as assignee_email, 
        a.profile_picture as assignee_picture,
        r.name as reporter_name,
        p.name as project_name, p.workspace_id,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count,
        (SELECT COUNT(*) FROM attachments WHERE task_id = t.id) as attachment_count,
        wm.user_id as assignee_user_id
      FROM tasks t
      LEFT JOIN users u ON t.created_by_id = u.id
      LEFT JOIN workspace_members wm ON t.assignee_id = wm.id
      LEFT JOIN users a ON wm.user_id = a.id
      LEFT JOIN users r ON t.reporter_id = r.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByProject(projectId, filters = {}) {
    const conditions = ['t.project_id = $1'];
    const values = [projectId];
    let paramIndex = 2;

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      conditions.push(`t.status = ANY($${paramIndex})`);
      values.push(statuses);
      paramIndex++;
    }

    if (filters.priority) {
      conditions.push(`t.priority = $${paramIndex}`);
      values.push(filters.priority);
      paramIndex++;
    }

    if (filters.assigneeId) {
      conditions.push(`t.assignee_id = $${paramIndex}`);
      values.push(filters.assigneeId);
      paramIndex++;
    }

    if (filters.isArchived !== undefined) {
      conditions.push(`t.is_archived = $${paramIndex}`);
      values.push(filters.isArchived);
      paramIndex++;
    } else {
      conditions.push('t.is_archived = FALSE');
    }

    if (filters.search) {
      conditions.push(`(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.dueBefore) {
      conditions.push(`t.due_date <= $${paramIndex}`);
      values.push(filters.dueBefore);
      paramIndex++;
    }

    if (filters.dueAfter) {
      conditions.push(`t.due_date >= $${paramIndex}`);
      values.push(filters.dueAfter);
      paramIndex++;
    }

    // Sorting
    let orderBy = 't.position ASC, t.created_at DESC';
    if (filters.sortBy) {
      const sortField = filters.sortBy === 'dueDate' ? 'due_date' 
        : filters.sortBy === 'priority' ? 'priority'
        : filters.sortBy === 'createdAt' ? 'created_at'
        : 'position';
      const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
      orderBy = `t.${sortField} ${sortOrder}`;
    }

    // Pagination
    let limitClause = '';
    if (filters.limit) {
      const limit = parseInt(filters.limit);
      const offset = ((parseInt(filters.page) || 1) - 1) * limit;
      limitClause = ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const query = `
      SELECT t.*,
        u.name as created_by_name,
        a.name as assignee_name, a.profile_picture as assignee_picture,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) as comment_count,
        (SELECT COUNT(*) FROM attachments WHERE task_id = t.id) as attachment_count
      FROM tasks t
      LEFT JOIN users u ON t.created_by_id = u.id
      LEFT JOIN workspace_members wm ON t.assignee_id = wm.id
      LEFT JOIN users a ON wm.user_id = a.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}${limitClause}
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows;
  }

  static async countByProject(projectId, filters = {}) {
    const conditions = ['project_id = $1'];
    const values = [projectId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.isArchived !== undefined) {
      conditions.push(`is_archived = $${paramIndex}`);
      values.push(filters.isArchived);
    } else {
      conditions.push('is_archived = FALSE');
    }

    const query = `SELECT COUNT(*) as count FROM tasks WHERE ${conditions.join(' AND ')}`;
    const result = await QueryHelper.query(query, values);
    return parseInt(result.rows[0].count);
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'description', 'status', 'priority', 'due_date',
      'story_points', 'position', 'assignee_id', 'reporter_id',
      'is_archived', 'metadata', 'completed_at',
    ];

    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key) && data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE tasks 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, title, description, status, priority, due_date, story_points,
                position, is_archived, metadata, project_id, created_by_id,
                assignee_id, reporter_id, created_at, updated_at, completed_at
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows[0] || null;
  }

  static async updateStatus(id, status, position) {
    const completedAt = status === 'DONE' ? 'CURRENT_TIMESTAMP' : 'NULL';
    
    if (position !== undefined) {
      const query = `
        UPDATE tasks 
        SET status = $1, position = $2, completed_at = ${completedAt}
        WHERE id = $3
        RETURNING id, title, status, position, completed_at, updated_at
      `;
      const result = await QueryHelper.query(query, [status, position, id]);
      return result.rows[0] || null;
    }

    const query = `
      UPDATE tasks 
      SET status = $1, completed_at = ${completedAt}
      WHERE id = $2
      RETURNING id, title, status, position, completed_at, updated_at
    `;
    const result = await QueryHelper.query(query, [status, id]);
    return result.rows[0] || null;
  }

  static async reorderTasks(projectId, status, taskIds) {
    const updates = taskIds.map((taskId, index) => {
      return QueryHelper.query(
        `UPDATE tasks SET position = $1, status = $2 WHERE id = $3 AND project_id = $4`,
        [index + 1, status, taskId, projectId]
      );
    });
    await Promise.all(updates);
    return true;
  }

  static async delete(id) {
    const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async archive(id) {
    const query = `
      UPDATE tasks 
      SET is_archived = TRUE 
      WHERE id = $1
      RETURNING id, title, is_archived
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async unarchive(id) {
    const query = `
      UPDATE tasks 
      SET is_archived = FALSE 
      WHERE id = $1
      RETURNING id, title, is_archived
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async duplicate(id, userId) {
    const task = await this.findById(id);
    if (!task) return null;

    const taskData = {
      title: `${task.title} (Copy)`,
      description: task.description,
      status: 'TODO',
      priority: task.priority,
      dueDate: task.due_date,
      storyPoints: task.story_points,
      projectId: task.project_id,
      createdById: userId,
      assigneeId: task.assignee_id,
      reporterId: userId,
      metadata: task.metadata,
    };

    return this.create(taskData);
  }

  static async getStatsByProject(projectId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'TODO') as todo,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'REVIEW') as review,
        COUNT(*) FILTER (WHERE status = 'DONE') as done,
        COUNT(*) FILTER (WHERE status = 'BLOCKED') as blocked,
        COUNT(*) FILTER (WHERE priority = 'URGENT') as urgent,
        COUNT(*) FILTER (WHERE priority = 'HIGH') as high,
        COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium,
        COUNT(*) FILTER (WHERE priority = 'LOW') as low,
        COUNT(*) FILTER (
          WHERE due_date < CURRENT_TIMESTAMP AND status != 'DONE'
        ) as overdue
      FROM tasks 
      WHERE project_id = $1 AND is_archived = FALSE
    `;
    const result = await QueryHelper.query(query, [projectId]);
    return result.rows[0];
  }

  static async getMyTasks(userId, filters = {}) {
    const conditions = ['wm.user_id = $1', 't.is_archived = FALSE'];
    const values = [userId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`t.status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.projectId) {
      conditions.push(`t.project_id = $${paramIndex}`);
      values.push(filters.projectId);
      paramIndex++;
    }

    const query = `
      SELECT t.*,
        p.name as project_name, p.workspace_id,
        u.name as created_by_name
      FROM tasks t
      LEFT JOIN workspace_members wm ON t.assignee_id = wm.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.created_by_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY 
        CASE t.priority 
          WHEN 'URGENT' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
        END,
        t.due_date ASC NULLS LAST
      LIMIT 100
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows;
  }
}

module.exports = TaskQueries;