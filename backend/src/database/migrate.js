/**
 * Applies database/schema.sql (and any .sql file in database/migrations/).
 *
 * Usage:   node src/database/migrate.js
 * Docker:  handled automatically by the postgres init script.
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');
const logger = require('../utils/logger');

const ROOT = path.resolve(__dirname, '../../../database');

async function runFile(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    logger.warn(`Skipping missing file: ${full}`);
    return;
  }
  const sql = fs.readFileSync(full, 'utf8');
  logger.info(`Applying ${file}...`);
  await pool.query(sql);
  logger.info(`Applied ${file}`);
}

async function main() {
  try {
    await runFile('schema.sql');
    await runFile('seed.sql');

    const migrationsDir = path.join(ROOT, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
      for (const f of files) {
        await runFile(path.join('migrations', f));
      }
    }

    logger.info('Migration complete.');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed', err);
    process.exit(1);
  }
}

main();
