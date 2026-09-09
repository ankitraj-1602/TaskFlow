const QueryHelper = require('./helper');

class UserQueries {
  static async create(userData) {
    const { email, password_hash, name, job_title, timezone } = userData;
    const query = `
      INSERT INTO users (email, password_hash, name, job_title, timezone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, bio, job_title, timezone, profile_picture, 
                is_email_verified, created_at, updated_at, last_login_at
    `;
    const result = await QueryHelper.query(query, [
      email, password_hash, name, job_title, timezone || 'UTC'
    ]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const result = await QueryHelper.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
    const result = await QueryHelper.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByRefreshToken(refreshToken) {
    const query = `
      SELECT * FROM users 
      WHERE refresh_token = $1 
      AND refresh_token_expiry > CURRENT_TIMESTAMP 
      AND deleted_at IS NULL
    `;
    const result = await QueryHelper.query(query, [refreshToken]);
    return result.rows[0] || null;
  }

  static async updateRefreshToken(userId, refreshToken, expiry) {
    const query = `
      UPDATE users 
      SET refresh_token = $1, refresh_token_expiry = $2
      WHERE id = $3
    `;
    await QueryHelper.query(query, [refreshToken, expiry, userId]);
  }

  static async clearRefreshToken(userId) {
    const query = `
      UPDATE users 
      SET refresh_token = NULL, refresh_token_expiry = NULL
      WHERE id = $1
    `;
    await QueryHelper.query(query, [userId]);
  }

  static async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';
    await QueryHelper.query(query, [userId]);
  }

  static async verifyEmail(userId) {
    const query = 'UPDATE users SET is_email_verified = TRUE WHERE id = $1';
    await QueryHelper.query(query, [userId]);
  }

  static async update(userId, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['name', 'bio', 'job_title', 'timezone', 'profile_picture'];
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key) && data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(data[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      const user = await this.findById(userId);
      const { password_hash, refresh_token, refresh_token_expiry, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, bio, job_title, timezone, profile_picture, 
                is_email_verified, created_at, updated_at, last_login_at
    `;
    const result = await QueryHelper.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(userId, passwordHash) {
    const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
    await QueryHelper.query(query, [passwordHash, userId]);
  }
}

module.exports = UserQueries;