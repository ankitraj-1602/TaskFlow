const QueryHelper = require('./helper');

class ProjectQueries {
  static async create(projectData) {
    const { name, description, workspaceId, createdById, status, startDate, dueDate } = projectData;
    const query = `
      INSERT INTO projects (name, description, workspace_id, created_by_id, status, start_date, due_date, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $4)
      RETURNING id, name, description, status, start_date, due_date, 
                is_archived, settings, workspace_id, created_by_id, owner_id,
                created_at, updated_at
    `;
    const result = await QueryHelper.query(query, [
      name,
      description,
      workspaceId,
      createdById,
      status || 'PLANNING',
      startDate,
      dueDate,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT p.*, 
        u.name as created_by_name, u.email as created_by_email,
        o.name as owner_name, o.email as owner_email,
        w.name as workspace_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND is_archived = FALSE) as task_count
      FROM projects p
      LEFT JOIN users u ON p.created_by_id = u.id
      LEFT JOIN users o ON p.owner_id = o.id
      LEFT JOIN workspaces w ON p.workspace_id = w.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByWorkspace(workspaceId, filters = {}) {
    const conditions = ['p.workspace_id = $1', 'p.deleted_at IS NULL'];
    const values = [workspaceId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`p.status = $${paramIndex}`);
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.isArchived !== undefined) {
      conditions.push(`p.is_archived = $${paramIndex}`);
      values.push(filters.isArchived);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const query = `
      SELECT p.*, 
        u.name as created_by_name,
        o.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND is_archived = FALSE) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      LEFT JOIN users u ON p.created_by_id = u.id
      LEFT JOIN users o ON p.owner_id = o.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'status', 'start_date', 'due_date',
      'is_archived', 'settings', 'owner_id'
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
      UPDATE projects 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, name, description, status, start_date, due_date,
                is_archived, settings, workspace_id, created_by_id, owner_id,
                created_at, updated_at
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `
      UPDATE projects 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING id
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async archive(id) {
    const query = `
      UPDATE projects 
      SET is_archived = TRUE, status = 'ARCHIVED'
      WHERE id = $1
      RETURNING id, name, is_archived, status
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async unarchive(id) {
    const query = `
      UPDATE projects 
      SET is_archived = FALSE, status = 'ACTIVE'
      WHERE id = $1
      RETURNING id, name, is_archived, status
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async addMember(projectId, workspaceMemberId, role = 'MEMBER') {
    const query = `
      INSERT INTO project_members (project_id, workspace_member_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, workspace_member_id) 
      DO UPDATE SET role = $3
      RETURNING id, project_id, workspace_member_id, role, joined_at
    `;
    const result = await QueryHelper.query(query, [projectId, workspaceMemberId, role]);
    return result.rows[0];
  }

  static async removeMember(projectId, workspaceMemberId) {
    const query = `
      DELETE FROM project_members 
      WHERE project_id = $1 AND workspace_member_id = $2
      RETURNING id
    `;
    const result = await QueryHelper.query(query, [projectId, workspaceMemberId]);
    return result.rows[0] || null;
  }

  static async getMembers(projectId) {
    const query = `
      SELECT 
        pm.id, pm.role, pm.joined_at,
        wm.id as workspace_member_id,
        u.id as user_id, u.name, u.email, u.profile_picture, u.job_title
      FROM project_members pm
      JOIN workspace_members wm ON pm.workspace_member_id = wm.id
      JOIN users u ON wm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.role DESC, u.name ASC
    `;
    const result = await QueryHelper.query(query, [projectId]);
    return result.rows;
  }

  static async isMember(projectId, userId) {
    const query = `
      SELECT pm.id 
      FROM project_members pm
      JOIN workspace_members wm ON pm.workspace_member_id = wm.id
      WHERE pm.project_id = $1 AND wm.user_id = $2
    `;
    const result = await QueryHelper.query(query, [projectId, userId]);
    return result.rows.length > 0;
  }

  static async getStats(projectId) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'TODO') as todo_count,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'REVIEW') as review_count,
        COUNT(*) FILTER (WHERE status = 'DONE') as done_count,
        COUNT(*) FILTER (WHERE status = 'BLOCKED') as blocked_count,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE due_date < CURRENT_TIMESTAMP AND status != 'DONE') as overdue_count
      FROM tasks 
      WHERE project_id = $1 AND is_archived = FALSE
    `;
    const result = await QueryHelper.query(query, [projectId]);
    return result.rows[0];
  }

  static async updateTaskCount(projectId) {
    // Just for reference - not needed as we use subqueries
    const query = `
      SELECT COUNT(*) as count FROM tasks 
      WHERE project_id = $1 AND is_archived = FALSE
    `;
    const result = await QueryHelper.query(query, [projectId]);
    return parseInt(result.rows[0].count);
  }
  static async findMemberById(projectId, memberId) {
  const query = `
    SELECT pm.id, pm.role, pm.workspace_member_id, wm.user_id
    FROM project_members pm
    JOIN workspace_members wm ON pm.workspace_member_id = wm.id
    WHERE pm.id = $1 AND pm.project_id = $2
  `;
  const result = await QueryHelper.query(query, [memberId, projectId]);
  return result.rows[0] || null;
}

static async removeMemberById(projectId, memberId) {
  const query = `
    DELETE FROM project_members 
    WHERE id = $1 AND project_id = $2
    RETURNING id
  `;
  const result = await QueryHelper.query(query, [memberId, projectId]);
  return result.rows[0] || null;
}
}

module.exports = ProjectQueries;