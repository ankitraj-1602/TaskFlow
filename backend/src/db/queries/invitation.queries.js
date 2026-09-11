const QueryHelper = require('./helper');

class InvitationQueries {
  static async create(invitationData) {
    const { token, email, role, workspaceId, invitedBy, expiresAt } = invitationData;
    const query = `
      INSERT INTO workspace_invitations (token, email, role, workspace_id, invited_by, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, token, email, role, workspace_id, invited_by, expires_at, created_at
    `;
    const result = await QueryHelper.query(query, [
      token, email, role, workspaceId, invitedBy, expiresAt,
    ]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = `
      SELECT wi.*, w.name as workspace_name, u.name as inviter_name
      FROM workspace_invitations wi
      JOIN workspaces w ON wi.workspace_id = w.id
      JOIN users u ON wi.invited_by = u.id
      WHERE wi.token = $1 
      AND wi.expires_at > CURRENT_TIMESTAMP 
      AND wi.accepted_at IS NULL
    `;
    const result = await QueryHelper.query(query, [token]);
    return result.rows[0] || null;
  }

  static async findByEmail(email, workspaceId) {
    const query = `
      SELECT * FROM workspace_invitations 
      WHERE email = $1 
      AND workspace_id = $2 
      AND accepted_at IS NULL
      AND expires_at > CURRENT_TIMESTAMP
    `;
    const result = await QueryHelper.query(query, [email, workspaceId]);
    return result.rows[0] || null;
  }

  static async findByWorkspace(workspaceId) {
    const query = `
      SELECT wi.*, u.name as inviter_name
      FROM workspace_invitations wi
      JOIN users u ON wi.invited_by = u.id
      WHERE wi.workspace_id = $1 
      AND wi.accepted_at IS NULL
      AND wi.expires_at > CURRENT_TIMESTAMP
      ORDER BY wi.created_at DESC
    `;
    const result = await QueryHelper.query(query, [workspaceId]);
    return result.rows;
  }

  static async accept(token, userId) {
    const query = `
      UPDATE workspace_invitations 
      SET accepted_at = CURRENT_TIMESTAMP, accepted_by = $2
      WHERE token = $1
      RETURNING id, workspace_id, email, role
    `;
    const result = await QueryHelper.query(query, [token, userId]);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = 'DELETE FROM workspace_invitations WHERE id = $1 RETURNING id';
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async deleteByWorkspaceAndEmail(workspaceId, email) {
    const query = `
      DELETE FROM workspace_invitations 
      WHERE workspace_id = $1 AND email = $2 AND accepted_at IS NULL
      RETURNING id
    `;
    const result = await QueryHelper.query(query, [workspaceId, email]);
    return result.rows;
  }
}

module.exports = InvitationQueries;