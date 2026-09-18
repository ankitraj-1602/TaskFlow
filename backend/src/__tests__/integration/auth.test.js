const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');

// Unique email per test run to avoid collisions
const TEST_EMAIL = `test-auth-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test@123456';

describe('Auth API — Integration', () => {
  // ─── Cleanup BEFORE all tests ─────────────────
  beforeAll(async () => {
    // Delete any leftover test users from prior runs
    await db.query(
      "DELETE FROM users WHERE email LIKE 'test-auth-%@example.com'"
    );
  });

  // ─── Cleanup AFTER all tests ──────────────────
  afterAll(async () => {
    await db.query(
      "DELETE FROM users WHERE email LIKE 'test-auth-%@example.com'"
    );
  });

  // ═══════════════════════════════════════════════
  // POST /api/auth/register
  // ═══════════════════════════════════════════════
  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: 'Test User',
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_EMAIL);
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      // Security: password hash must not leak
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: TEST_PASSWORD,
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/validation/i);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test-auth-weak-${Date.now()}@example.com`,
          password: 'weak',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when email already exists', async () => {
      // Email is already registered from the first test
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists/i);
    });
  });

  // ═══════════════════════════════════════════════
  // POST /api/auth/login
  // ═══════════════════════════════════════════════
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return 200', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: TEST_EMAIL,
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: TEST_PASSWORD,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════
  // GET /api/auth/profile (protected)
  // ═══════════════════════════════════════════════
  describe('GET /api/auth/profile', () => {
    let accessToken;

    beforeAll(async () => {
      // Login to get a valid access token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      accessToken = loginRes.body.data.tokens.accessToken;
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token-xyz')
        .expect(401);
    });

    it('should return profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(TEST_EMAIL);
      // Security: no password hash leak
      expect(response.body.data).not.toHaveProperty('password_hash');
      expect(response.body.data).not.toHaveProperty('refresh_token');
    });
  });

  // ═══════════════════════════════════════════════
  // PATCH /api/auth/profile (protected)
  // ═══════════════════════════════════════════════
  describe('PATCH /api/auth/profile', () => {
    let accessToken;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      accessToken = loginRes.body.data.tokens.accessToken;
    });

    it('should update the user profile', async () => {
      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Name',
          bio: 'Test bio',
          jobTitle: 'Senior Engineer',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should reject without auth', async () => {
      await request(app)
        .patch('/api/auth/profile')
        .send({ name: 'Hacker' })
        .expect(401);
    });
  });
});