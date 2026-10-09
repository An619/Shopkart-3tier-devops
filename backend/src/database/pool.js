const { Pool } = require('pg');
const dbConfig = require('../config/db');
const logger = require('../utils/logger');

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  logger.debug('Postgres client connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle Postgres client', err);
});

// Simple query helper — always uses the pool, releases the client automatically.
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('executed query', { text, duration, rows: res.rowCount });
  return res;
}

module.exports = { pool, query };
