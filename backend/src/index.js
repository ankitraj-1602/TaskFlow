const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();
const http = require('http');
const { initSocket } = require('./config/socket');

const authRoutes = require('./routes/auth.routes');
const commentRoutes = require('./routes/comment.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const invitationRoutes = require("./routes/invitation.routes")
const activityRoutes = require('./routes/activity.routes');
const notificationRoutes = require('./routes/notification.routes');
const { apiRateLimiter } = require('./middleware/rateLimit.middleware');
const dashboardRoutes = require('./routes/dashboard.routes');
const ProjectController = require('./controllers/project.controller');
const { authenticate } = require('./middleware/auth.middleware');
const WorkspaceController = require('./controllers/workspace.controller');
const { connectRedis } = require('./config/redis');
const pool = require('./config/database');
const { isRedisReady } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  maxAge: 86400,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiRateLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TaskFlow API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', commentRoutes);
app.use('/api', activityRoutes);
app.use('/api', dashboardRoutes);

app.get('/api/me/projects', authenticate, ProjectController.getMyProjects);
app.get('/api/me/team', authenticate, WorkspaceController.getMyTeam);

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



app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});


const server = http.createServer(app);
initSocket(server);

// Connect to Redis (non-blocking — app works without it)
connectRedis();

server.listen(PORT, () => {
  console.log(`🚀 TaskFlow backend running on http://localhost:${PORT}`);
  console.log(`🔐 Auth: /api/auth`);
  console.log(`🏢 Workspaces: /api/workspaces`);
  console.log(`📁 Projects: /api/projects`);
  console.log(`✅ Tasks: /api/projects/:id/tasks`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});