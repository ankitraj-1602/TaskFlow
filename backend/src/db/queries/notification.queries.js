const QueryHelper = require('./helper');

class NotificationQueries {
  static async create(data) {
    const { type, content, data: jsonData, userId, actorId } = data;

    const query = `
      INSERT INTO notifications (type, content, data, user_id, actor_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, type, content, data, is_read, read_at, user_id, actor_id, created_at
    `;
    const result = await QueryHelper.query(query, [
      type,
      content,
      jsonData ? JSON.stringify(jsonData) : null,
      userId,
      actorId || null,
    ]);
    return result.rows[0];
  }

  static async findByUser(userId, filters = {}) {
    const conditions = ['n.user_id = $1'];
    const values = [userId];
    let paramIndex = 2;

    // Only unread?
    if (filters.unreadOnly) {
      conditions.push('n.is_read = FALSE');
    }

    // Filter by type
    if (filters.type) {
      const types = Array.isArray(filters.type)
        ? filters.type
        : String(filters.type).split(',').map((s) => s.trim());
      if (types.length === 1) {
        conditions.push(`n.type = $${paramIndex}`);
        values.push(types[0]);
        paramIndex++;
      } else {
        conditions.push(`n.type = ANY($${paramIndex}::notification_type[])`);
        values.push(types);
        paramIndex++;
      }
    }

    // Pagination
    let limitClause = '';
    if (filters.limit) {
      const limit = parseInt(filters.limit);
      const offset = ((parseInt(filters.page) || 1) - 1) * limit;
      limitClause = ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const query = `
      SELECT 
        n.id, n.type, n.content, n.data, n.is_read, n.read_at, 
        n.user_id, n.actor_id, n.created_at,
        u.name as actor_name, u.email as actor_email,
        u.profile_picture as actor_picture
      FROM notifications n
      LEFT JOIN users u ON n.actor_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
      ${limitClause}
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows;
  }

  static async countUnread(userId) {
    const query = `
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = $1 AND is_read = FALSE
    `;
    const result = await QueryHelper.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async markAsRead(id, userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING id, is_read, read_at
    `;
    const result = await QueryHelper.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = FALSE
      RETURNING id
    `;
    const result = await QueryHelper.query(query, [userId]);
    return result.rowCount;
  }

  static async delete(id, userId) {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await QueryHelper.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  static async deleteAllForUser(userId) {
    const query = 'DELETE FROM notifications WHERE user_id = $1';
    const result = await QueryHelper.query(query, [userId]);
    return result.rowCount;
  }
}

module.exports = NotificationQueries;