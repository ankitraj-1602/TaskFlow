const request = require('supertest');
const app = require('../../app');

describe('Health Check API', () => {
  it('GET /health should return 200 with OK status', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.message).toBe('TaskFlow API is running');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });
});