const QueryHelper = require('./helper');

class AttachmentQueries {
  static async create(data) {
    const {
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      taskId,
      uploadedById,
    } = data;

    const query = `
      INSERT INTO attachments (file_name, file_url, file_size, mime_type, task_id, uploaded_by_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, file_name, file_url, file_size, mime_type, task_id, uploaded_by_id, uploaded_at
    `;
    const result = await QueryHelper.query(query, [
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      taskId,
      uploadedById,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT 
        a.*,
        u.name as uploader_name,
        u.email as uploader_email,
        u.profile_picture as uploader_picture
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by_id = u.id
      WHERE a.id = $1
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByTask(taskId) {
    const query = `
      SELECT 
        a.id, a.file_name, a.file_url, a.file_size, a.mime_type,
        a.task_id, a.uploaded_by_id, a.uploaded_at,
        u.name as uploader_name,
        u.profile_picture as uploader_picture
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by_id = u.id
      WHERE a.task_id = $1
      ORDER BY a.uploaded_at DESC
    `;
    const result = await QueryHelper.query(query, [taskId]);
    return result.rows;
  }

  static async delete(id) {
    const query = `DELETE FROM attachments WHERE id = $1 RETURNING id, file_url`;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async countByTask(taskId) {
    const query = `SELECT COUNT(*) as count FROM attachments WHERE task_id = $1`;
    const result = await QueryHelper.query(query, [taskId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = AttachmentQueries;