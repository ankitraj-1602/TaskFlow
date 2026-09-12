const QueryHelper = require('./helper');

class CommentQueries {
  static async create(commentData) {
    const { content, taskId, authorId, parentId } = commentData;

    const query = `
      INSERT INTO comments (content, task_id, author_id, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, task_id, author_id, parent_id, 
                is_edited, created_at, updated_at
    `;
    const result = await QueryHelper.query(query, [
      content,
      taskId,
      authorId,
      parentId || null,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT c.*,
        u.name as author_name, u.email as author_email,
        u.profile_picture as author_picture
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = $1
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Fetch all comments for a task, flattened with reply info.
   * Order: top-level comments by created_at ASC, replies grouped under parents.
   */
  static async findByTask(taskId) {
    const query = `
      SELECT 
        c.id, c.content, c.is_edited, c.edited_at,
        c.task_id, c.author_id, c.parent_id,
        c.created_at, c.updated_at,
        u.name as author_name, u.email as author_email,
        u.profile_picture as author_picture
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
    `;
    const result = await QueryHelper.query(query, [taskId]);

    // Flatten into a nested structure: top-level comments with replies
    const comments = result.rows;
    const map = new Map();
    const roots = [];

    // First pass: map all comments by id
    comments.forEach((c) => {
      map.set(c.id, { ...c, replies: [] });
    });

    // Second pass: build parent-child relationships
    comments.forEach((c) => {
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) parent.replies.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    });

    return roots;
  }

  static async update(id, content) {
    const query = `
      UPDATE comments 
      SET content = $1, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, content, is_edited, edited_at, task_id, author_id, 
                parent_id, created_at, updated_at
    `;
    const result = await QueryHelper.query(query, [content, id]);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `DELETE FROM comments WHERE id = $1 RETURNING id`;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async countByTask(taskId) {
    const query = `SELECT COUNT(*) as count FROM comments WHERE task_id = $1`;
    const result = await QueryHelper.query(query, [taskId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = CommentQueries;