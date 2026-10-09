const request = require('supertest');

// Mock the DB pool so health can run without Postgres
jest.mock('../src/database/pool', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  },
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns 200 with status ok when DB is reachable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database).toBe('up');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/route not found/i);
  });
});
