const QueryHelper = require('./helper');

class SessionQueries {
    /**
     * Create a new session (on login/register).
     */
    static async create({
        userId,
        refreshToken,
        refreshTokenExpiry,
        userAgent,
        ipAddress,
    }) {
        const query = `
      INSERT INTO sessions (
        user_id, refresh_token, refresh_token_expiry, user_agent, ip_address
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, user_agent, ip_address, created_at, last_used_at
    `;
        const result = await QueryHelper.query(query, [
            userId,
            refreshToken,
            refreshTokenExpiry,
            userAgent || null,
            ipAddress || null,
        ]);
        return result.rows[0];
    }

    /**
     * Find a session by refresh token (used during token refresh).
     */
    static async findByRefreshToken(refreshToken) {
        const query = `
      SELECT s.*, u.email, u.name
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token = $1 AND s.refresh_token_expiry > CURRENT_TIMESTAMP
    `;
        const result = await QueryHelper.query(query, [refreshToken]);
        return result.rows[0] || null;
    }

    /**
     * List all active sessions for a user.
     */
    static async findByUser(userId) {
        const query = `
      SELECT id, user_id, user_agent, ip_address, refresh_token,
             created_at, last_used_at
      FROM sessions
      WHERE user_id = $1 AND refresh_token_expiry > CURRENT_TIMESTAMP
      ORDER BY last_used_at DESC
    `;
        const result = await QueryHelper.query(query, [userId]);
        return result.rows;
    }

    /**
     * Touch last_used_at (called on every token refresh).
     */
    static async updateLastUsed(id) {
        const query = `UPDATE sessions SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1`;
        await QueryHelper.query(query, [id]);
    }

    /**
     * Rotate the refresh token (on token refresh).
     * Updates the session row to use a new refresh token.
     */
    static async rotateRefreshToken(id, newRefreshToken, newExpiry) {
        const query = `
      UPDATE sessions
      SET refresh_token = $1, refresh_token_expiry = $2, last_used_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id
    `;
        const result = await QueryHelper.query(query, [newRefreshToken, newExpiry, id]);
        return result.rows[0] || null;
    }

    /**
     * Delete a single session (logout of one device).
     */
    static async deleteByRefreshToken(refreshToken) {
        const query = `DELETE FROM sessions WHERE refresh_token = $1 RETURNING id`;
        const result = await QueryHelper.query(query, [refreshToken]);
        return result.rows[0] || null;
    }

    /**
     * Delete a specific session by ID (user revokes another device).
     */
    static async deleteById(id, userId) {
        const query = `
      DELETE FROM sessions 
      WHERE id = $1 AND user_id = $2 
      RETURNING id
    `;
        const result = await QueryHelper.query(query, [id, userId]);
        return result.rows[0] || null;
    }

    /**
     * Delete all sessions for a user (logout all devices).
     */
    static async deleteAllForUser(userId) {
        const query = `DELETE FROM sessions WHERE user_id = $1 RETURNING id`;
        const result = await QueryHelper.query(query, [userId]);
        return result.rowCount;
    }

    static async findById(id) {
        const query = `
    SELECT id, user_id, user_agent, ip_address, created_at, last_used_at
    FROM sessions
    WHERE id = $1 AND refresh_token_expiry > CURRENT_TIMESTAMP
  `;
        const result = await QueryHelper.query(query, [id]);
        return result.rows[0] || null;
    }
}

module.exports = SessionQueries;