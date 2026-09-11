const QueryHelper = require('./helper');

class WorkspaceQueries {
  static async create(workspaceData) {
    const { name, slug, description, ownerId } = workspaceData;
    const query = `
      INSERT INTO workspaces (name, slug, description, owner_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, slug, description, logo, settings, owner_id, 
                created_at, updated_at
    `;
    const result = await QueryHelper.query(query, [name, slug, description, ownerId]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT w.*, u.name as owner_name, u.email as owner_email
      FROM workspaces w
      LEFT JOIN users u ON w.owner_id = u.id
      WHERE w.id = $1 AND w.deleted_at IS NULL
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findBySlug(slug) {
    const query = `
      SELECT * FROM workspaces 
      WHERE slug = $1 AND deleted_at IS NULL
    `;
    const result = await QueryHelper.query(query, [slug]);
    return result.rows[0] || null;
  }

  static async findByUser(userId) {
    const query = `
      SELECT DISTINCT w.*, 
        (SELECT role FROM workspace_members WHERE workspace_id = w.id AND user_id = $1) as member_role,
        CASE WHEN w.owner_id = $1 THEN 'OWNER' ELSE NULL END as owner_role
      FROM workspaces w
      LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE (w.owner_id = $1 OR wm.user_id = $1)
      AND w.deleted_at IS NULL
      ORDER BY w.created_at DESC
    `;
    const result = await QueryHelper.query(query, [userId]);
    return result.rows;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'description', 'logo', 'settings'];
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
      UPDATE workspaces 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, name, slug, description, logo, settings, owner_id, 
                created_at, updated_at
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `
      UPDATE workspaces 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING id
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async addMember(workspaceId, userId, role = 'MEMBER', invitedBy = null) {
    const query = `
      INSERT INTO workspace_members (workspace_id, user_id, role, invited_by, invited_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (workspace_id, user_id) 
      DO UPDATE SET role = $3, invited_by = $4, invited_at = CURRENT_TIMESTAMP
      RETURNING id, workspace_id, user_id, role, joined_at, invited_by, invited_at
    `;
    const result = await QueryHelper.query(query, [workspaceId, userId, role, invitedBy]);
    return result.rows[0];
  }

  static async removeMember(workspaceId, userId) {
    const query = `
      DELETE FROM workspace_members 
      WHERE workspace_id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await QueryHelper.query(query, [workspaceId, userId]);
    return result.rows[0] || null;
  }

  static async getMembers(workspaceId) {
    const query = `
      SELECT 
        wm.id, wm.role, wm.joined_at, wm.invited_by, wm.invited_at,
        u.id as user_id, u.name, u.email, u.profile_picture, u.job_title
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = $1
      ORDER BY wm.role DESC, u.name ASC
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return result.rows;
  }

  static async getUserRole(workspaceId, userId) {
    const query = `
      SELECT role FROM workspace_members 
      WHERE workspace_id = $1 AND user_id = $2
    `;
    const result = await QueryHelper.query(query, [workspaceId, userId]);
    return result.rows[0]?.role || null;
  }

static async updateMemberRole(workspaceId, memberId, role) {
  // memberId is workspace_members.id
  const query = `
    UPDATE workspace_members 
    SET role = $1 
    WHERE id = $2 AND workspace_id = $3
    RETURNING id, workspace_id, user_id, role, joined_at
  `;
  const result = await QueryHelper.query(query, [role, memberId, workspaceId]);
  return result.rows[0] || null;
}
static async removeMemberById(workspaceId, memberId) {
  const query = `
    DELETE FROM workspace_members 
    WHERE id = $1 AND workspace_id = $2
    RETURNING id
  `;
  const result = await QueryHelper.query(query, [memberId, workspaceId]);
  return result.rows[0] || null;
}
static async findMemberById(workspaceId, memberId) {
  const query = `
    SELECT wm.id, wm.role, wm.user_id
    FROM workspace_members wm
    WHERE wm.id = $1 AND wm.workspace_id = $2
  `;
  const result = await QueryHelper.query(query, [memberId, workspaceId]);
  return result.rows[0] || null;
}

  static async isMember(workspaceId, userId) {
    const query = `
      SELECT id FROM workspace_members 
      WHERE workspace_id = $1 AND user_id = $2
    `;
    const result = await QueryHelper.query(query, [workspaceId, userId]);
    return result.rows.length > 0;
  }

  static async isOwner(workspaceId, userId) {
    const query = `
      SELECT id FROM workspaces 
      WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
    `;
    const result = await QueryHelper.query(query, [workspaceId, userId]);
    return result.rows.length > 0;
  }
}

module.exports = WorkspaceQueries;