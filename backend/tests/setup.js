/**
 * Jest global setup. Runs before every test file.
 * We mock the database pool so tests don't need a real PostgreSQL.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_do_not_use_in_prod';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '4';

jest.setTimeout(15000);

// Silence logger noise during tests
jest.mock('../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));
