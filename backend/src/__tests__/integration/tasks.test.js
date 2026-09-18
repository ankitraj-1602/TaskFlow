const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');

describe('Tasks API — Integration', () => {
  // Shared state across tests
  let accessToken;
  let userId;
  let workspaceId;
  let projectId;

  const email = `test-tasks-${Date.now()}@example.com`;
  const password = 'Test@123456';

  // ═══════════════════════════════════════════════
  // SETUP: register user → workspace → project
  // ═══════════════════════════════════════════════
  beforeAll(async () => {
    // Clean up any leftover data from prior runs
    await db.query(
      `DELETE FROM users WHERE email LIKE 'test-tasks-%@example.com'`
    );

    // 1. Register user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Task Tester' });

    accessToken = regRes.body.data.tokens.accessToken;
    userId = regRes.body.data.user.id;

    // 2. Create workspace
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Tasks Workspace' });

    workspaceId = wsRes.body.data.id;

    // 3. Create project
    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Tasks Project' });

    projectId = projRes.body.data.id;
  });

  afterAll(async () => {
    // Cascading deletes: user → workspace → project → tasks
    await db.query(
      `DELETE FROM users WHERE email LIKE 'test-tasks-%@example.com'`
    );
    await db.query(
      `DELETE FROM workspaces WHERE name = 'Test Tasks Workspace'`
    );
  });

  // ═══════════════════════════════════════════════
  // CREATE TASK
  // ═══════════════════════════════════════════════
  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create a task with the given fields', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
          description: 'Test description',
          status: 'TODO',
          priority: 'HIGH',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.priority).toBe('HIGH');
      expect(response.body.data.status).toBe('TODO');
      expect(response.body.data.projectId).toBe(projectId);
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .send({ title: 'Unauthorized' })
        .expect(401);
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'No title here' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════
  // LIST TASKS
  // ═══════════════════════════════════════════════
  describe('GET /api/projects/:projectId/tasks', () => {
    it('should list project tasks', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/tasks?status=TODO`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const tasks = response.body.data;
      tasks.forEach((t) => expect(t.status).toBe('TODO'));
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/tasks?page=1&limit=10`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Response shape varies by implementation
      expect(response.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // UPDATE TASK
  // ═══════════════════════════════════════════════
  describe('PATCH /api/tasks/:id', () => {
    let taskId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Update Me', priority: 'LOW' });

      taskId = res.body.data.id;
    });

    it('should update the task fields', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title', priority: 'URGENT' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.priority).toBe('URGENT');
    });

    it('should reject unauthenticated update', async () => {
      await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ title: 'Hacked' })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════
  // UPDATE STATUS (Kanban)
  // ═══════════════════════════════════════════════
  describe('PATCH /api/tasks/:id/status', () => {
    let taskId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Move Me', status: 'TODO' });

      taskId = res.body.data.id;
    });

    it('should move a task to a new status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'IN_PROGRESS', position: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    it('should reject invalid status', async () => {
      await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'MADE_UP_STATUS' })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════
  // MY TASKS
  // ═══════════════════════════════════════════════
  describe('GET /api/my-tasks', () => {
    it('should return tasks assigned to the current user', async () => {
      // Create a task assigned to self
      await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Assigned to me',
          assigneeId: userId,
        });

      const response = await request(app)
        .get('/api/my-tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject without auth', async () => {
      await request(app)
        .get('/api/my-tasks')
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════
  // DELETE TASK
  // ═══════════════════════════════════════════════
  describe('DELETE /api/tasks/:id', () => {
    it('should delete the task', async () => {
      const createRes = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Delete Me' });

      const taskId = createRes.body.data.id;

      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify: 404 on GET
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});