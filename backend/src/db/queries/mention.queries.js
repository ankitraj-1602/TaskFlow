const QueryHelper = require('./helper');

class MentionQueries {
  static async createMany(commentId, userIds) {
    if (!userIds || userIds.length === 0) return [];

    // Insert one-by-one (small lists) with ON CONFLICT protection
    const values = userIds.map((userId) => `('${commentId}', '${userId}')`).join(',');

    const query = `
      INSERT INTO mentions (comment_id, user_id)
      VALUES ${values}
      ON CONFLICT (comment_id, user_id) DO NOTHING
      RETURNING id, comment_id, user_id
    `;
    const result = await QueryHelper.query(query);
    return result.rows;
  }

  static async deleteByComment(commentId) {
    const query = `DELETE FROM mentions WHERE comment_id = $1`;
    await QueryHelper.query(query, [commentId]);
  }

  static async findByComment(commentId) {
    const query = `
      SELECT m.id, m.user_id, u.name as user_name, u.email as user_email
      FROM mentions m
      JOIN users u ON m.user_id = u.id
      WHERE m.comment_id = $1
    `;
    const result = await QueryHelper.query(query, [commentId]);
    return result.rows;
  }
}

module.exports = MentionQueries;