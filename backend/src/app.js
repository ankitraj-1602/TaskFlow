const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// ─── Route imports ─────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const commentRoutes = require('./routes/comment.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const invitationRoutes = require('./routes/invitation.routes');
const activityRoutes = require('./routes/activity.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const searchRoutes = require('./routes/search.routes');

// ─── Middleware & Controllers ──────────────────────
const { apiRateLimiter } = require('./middleware/rateLimit.middleware');
const { authenticate } = require('./middleware/auth.middleware');
const ProjectController = require('./controllers/project.controller');
const WorkspaceController = require('./controllers/workspace.controller');
const AttachmentController = require('./controllers/attachment.controller');
const { isRedisReady } = require('./config/redis');
const pool = require('./config/database');
const queueDashboard = require('./config/queueDashboard');
const logger = require('./config/logger');

const app = express();

// ─── Global middleware ─────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  maxAge: 86400,
}));
app.use(compression());
// app.use(morgan('dev'));
const { requestLogger } = require('./middleware/logger.middleware');
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ─────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── Health check ──────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TaskFlow API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Routes ────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/admin/queues', queueDashboard.getRouter());
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', commentRoutes);
app.use('/api', activityRoutes);
app.use('/api', dashboardRoutes);

// Serve uploaded files (public — URLs contain random UUIDs)
app.get('/uploads/:year/:month/:filename', AttachmentController.serve);

// API routes
app.use('/api', attachmentRoutes);
app.use('/api/search', searchRoutes);

// ─── Direct endpoint routes ────────────────────────
app.get('/api/me/projects', authenticate, ProjectController.getMyProjects);
app.get('/api/me/team', authenticate, WorkspaceController.getMyTeam);

// ─── Detailed health check ─────────────────────────
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: isRedisReady() ? 'connected' : 'disconnected',
    },
  };

  try {
    await pool.query('SELECT 1');
    health.services.database = 'connected';
  } catch (err) {
    health.services.database = 'error';
    health.status = 'DEGRADED';
  }

  if (!isRedisReady()) {
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ─── 404 handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// ─── Error handler (must be LAST) ──────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;

  // Log full error with request context
  logger.error('Unhandled error', {
    correlationId: req.correlationId,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.userId,
    statusCode: status,
  });

  // Don't leak internal errors in production
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    correlationId: req.correlationId,   // ⬅️ NEW — helps users report issues
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;