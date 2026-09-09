const pool = require('../../config/database');

class QueryHelper {
  static async query(text, params = []) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  static async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static formatWhereClause(filters, allowedFields) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(filters).forEach((key) => {
      if (allowedFields.includes(key) && filters[key] !== undefined && filters[key] !== null) {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(filters[key]);
        paramIndex++;
      }
    });

    return {
      whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
      values,
    };
  }

  static buildPagination(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return { offset, limit };
  }
}

module.exports = QueryHelper;