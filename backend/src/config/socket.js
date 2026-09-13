const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('./database');

let io = null;

/**
 * Initialize Socket.IO with the HTTP server.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    path: '/socket.io',
  });

  // ─── Auth middleware ─────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const userId = decoded.userId;

      // Verify user still exists
      const result = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.userId = userId;
      socket.user = result.rows[0];
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection handler ──────────────────────────
  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.user.email} (${socket.id})`);

    // Join a user-specific room for personal notifications
    socket.join(`user:${socket.userId}`);

    // Join rooms for every workspace the user belongs to
    try {
      const { rows: workspaces } = await pool.query(
        `SELECT w.id FROM workspaces w
         LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE (w.owner_id = $1 OR wm.user_id = $1)
         AND w.deleted_at IS NULL`,
        [socket.userId]
      );

      workspaces.forEach((w) => {
        socket.join(`workspace:${w.id}`);
      });

      console.log(
        `📡 Joined ${workspaces.length} workspace room(s) for ${socket.user.email}`
      );
    } catch (error) {
      console.error('Failed to join workspace rooms:', error.message);
    }

    // ─── Client-triggered events ────────────────────
    socket.on('workspace:subscribe', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on('workspace:unsubscribe', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.email} (${socket.id})`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

/**
 * Emit an event to a specific room.
 * Safe to call even if Socket.IO hasn't initialized (no-op).
 */
const emitToRoom = (room, event, data) => {
  if (!io) return;
  io.to(room).emit(event, data);
};

/**
 * Emit to a specific user.
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit to a workspace.
 */
const emitToWorkspace = (workspaceId, event, data) => {
  if (!io) {
    console.warn('⚠️ emitToWorkspace called before io initialized');
    return;
  }
  const room = `workspace:${workspaceId}`;
  const size = io.sockets.adapter.rooms.get(room)?.size || 0;
  console.log(`📤 Emitting ${event} to room ${room} (${size} clients)`);
  io.to(room).emit(event, data);
};

module.exports = {
  initSocket,
  emitToRoom,
  emitToUser,
  emitToWorkspace,
  getIO: () => io,
};