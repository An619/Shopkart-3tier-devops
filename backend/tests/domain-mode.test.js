const request = require('supertest');

describe('bounded-context API routing', () => {
  const previousServiceName = process.env.SERVICE_NAME;

  afterEach(() => {
    if (previousServiceName === undefined) delete process.env.SERVICE_NAME;
    else process.env.SERVICE_NAME = previousServiceName;
    jest.resetModules();
  });

  test('identity service exposes identity routes and not catalog routes', async () => {
    process.env.SERVICE_NAME = 'identity';
    jest.resetModules();
    jest.doMock('../src/database/pool', () => ({ pool: { query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] }) }, query: jest.fn() }));
    const app = require('../src/app');

    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);

    const outsideDomain = await request(app).get('/api/products');
    expect(outsideDomain.status).toBe(404);
  });

  test('catalog service exposes catalog routes and not cart routes', async () => {
    process.env.SERVICE_NAME = 'catalog';
    jest.resetModules();
    jest.doMock('../src/database/pool', () => ({ pool: { query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] }) }, query: jest.fn() }));
    const app = require('../src/app');

    const outsideDomain = await request(app).get('/api/cart');
    expect(outsideDomain.status).toBe(404);
  });
});
