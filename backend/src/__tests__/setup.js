// Mock uuid — it's ESM-only and Jest runs in CommonJS
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).slice(2, 10),
}));

const db = require('../config/database');
const { client } = require('../config/redis');

jest.setTimeout(30000);

afterAll(async () => {
  try {
    await db.end();
  } catch (err) {}
  try {
    if (client.isOpen) {
      await client.quit();
    }
  } catch (err) {}
});