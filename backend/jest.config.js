module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/database/migrate.js',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 15000,
  verbose: true,
  forceExit: true,
};
