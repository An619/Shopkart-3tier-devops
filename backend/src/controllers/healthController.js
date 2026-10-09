const { pool } = require('../database/pool');
const { register } = require('../metrics/promClient');

async function health(_req, res) {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: { database: dbOk ? 'up' : 'down' },
  });
}

async function metrics(_req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

module.exports = { health, metrics };
