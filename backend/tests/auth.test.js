const request = require('supertest');

// ---- Mocks ----
jest.mock('../src/models/userModel', () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  list: jest.fn(),
  count: jest.fn(),
}));

jest.mock('../src/database/pool', () => ({
  pool: { query: jest.fn(), end: jest.fn(), on: jest.fn() },
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const userModel = require('../src/models/userModel');
const app = require('../src/app');

describe('Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'not-an-email', password: 'secret123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/validation/i);
    });

    it('rejects short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: '123' });

      expect(res.status).toBe(400);
    });

    it('creates a user and returns a token', async () => {
      userModel.findByEmail.mockResolvedValueOnce(null);
      userModel.create.mockResolvedValueOnce({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'secret123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('returns 409 for duplicate email', async () => {
      userModel.findByEmail.mockResolvedValueOnce({ id: 99, email: 'dupe@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Dupe', email: 'dupe@example.com', password: 'secret123' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 401 when user does not exist', async () => {
      userModel.findByEmail.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever123' });

      expect(res.status).toBe(401);
    });

    it('returns 400 on missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });
});
