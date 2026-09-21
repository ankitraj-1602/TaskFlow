const QueryHelper = require('./helper');

class LabelQueries {
  /**
   * Create a label.
   */
  static async create({ projectId, name, color, createdById }) {
    const query = `
      INSERT INTO labels (project_id, name, color, created_by_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, project_id, name, color, created_by_id, created_at, updated_at
    `;
    const result = await QueryHelper.query(query, [
      projectId,
      name,
      color,
      createdById,
    ]);
    return result.rows[0];
  }

  /**
   * Find label by ID.
   */
  static async findById(id) {
    const query = `
      SELECT l.*, u.name as created_by_name
      FROM labels l
      LEFT JOIN users u ON l.created_by_id = u.id
      WHERE l.id = $1
    `;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all labels in a project with usage counts.
   */
  static async findByProject(projectId) {
    const query = `
      SELECT 
        l.id, l.project_id, l.name, l.color, l.created_by_id,
        l.created_at, l.updated_at,
        u.name as created_by_name,
        COALESCE((SELECT COUNT(*) FROM task_labels WHERE label_id = l.id), 0) as usage_count
      FROM labels l
      LEFT JOIN users u ON l.created_by_id = u.id
      WHERE l.project_id = $1
      ORDER BY l.name ASC
    `;
    const result = await QueryHelper.query(query, [projectId]);
    return result.rows;
  }

  /**
   * Check if a label name already exists in the project.
   */
  static async findByName(projectId, name) {
    const query = `
      SELECT * FROM labels 
      WHERE project_id = $1 AND LOWER(name) = LOWER($2)
    `;
    const result = await QueryHelper.query(query, [projectId, name]);
    return result.rows[0] || null;
  }

  /**
   * Update a label.
   */
  static async update(id, data) {
    const fields = [];
    const values = [];
    let i = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${i++}`);
      values.push(data.name);
    }
    if (data.color !== undefined) {
      fields.push(`color = $${i++}`);
      values.push(data.color);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE labels 
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING id, project_id, name, color, created_by_id, created_at, updated_at
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a label. Cascades to task_labels.
   */
  static async delete(id) {
    const query = `DELETE FROM labels WHERE id = $1 RETURNING id`;
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Attach a label to a task.
   */
  static async attachToTask(taskId, labelId, addedById) {
    const query = `
      INSERT INTO task_labels (task_id, label_id, added_by_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (task_id, label_id) DO NOTHING
      RETURNING task_id, label_id, added_by_id, created_at
    `;
    const result = await QueryHelper.query(query, [taskId, labelId, addedById]);
    return result.rows[0] || null;
  }

  /**
   * Detach a label from a task.
   */
  static async detachFromTask(taskId, labelId) {
    const query = `
      DELETE FROM task_labels 
      WHERE task_id = $1 AND label_id = $2
      RETURNING task_id, label_id
    `;
    const result = await QueryHelper.query(query, [taskId, labelId]);
    return result.rows[0] || null;
  }

  /**
   * Get all labels for a task.
   */
  static async getTaskLabels(taskId) {
    const query = `
      SELECT 
        l.id, l.project_id, l.name, l.color, l.created_by_id,
        l.created_at, l.updated_at
      FROM labels l
      JOIN task_labels tl ON tl.label_id = l.id
      WHERE tl.task_id = $1
      ORDER BY l.name ASC
    `;
    const result = await QueryHelper.query(query, [taskId]);
    return result.rows;
  }

  /**
   * Get labels for multiple tasks in ONE query (avoids N+1).
   * Returns a Map<taskId, labels[]>
   */
  static async getLabelsForTasks(taskIds) {
    if (taskIds.length === 0) return new Map();

    const query = `
      SELECT 
        tl.task_id,
        l.id, l.project_id, l.name, l.color, l.created_at
      FROM labels l
      JOIN task_labels tl ON tl.label_id = l.id
      WHERE tl.task_id = ANY($1::uuid[])
      ORDER BY l.name ASC
    `;
    const result = await QueryHelper.query(query, [taskIds]);

    const map = new Map();
    for (const row of result.rows) {
      if (!map.has(row.task_id)) {
        map.set(row.task_id, []);
      }
      map.get(row.task_id).push({
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        color: row.color,
        createdAt: row.created_at,
      });
    }
    return map;
  }
}

module.exports = LabelQueries;