const app = require('./app');
const config = require('./config');
const { pool } = require('./database/pool');
const logger = require('./utils/logger');

const server = app.listen(config.port, config.host, () => {
  logger.info(`ShopKart API listening on http://${config.host}:${config.port}`);
  logger.info(`Environment: ${config.env}`);
});

// ---------- Graceful shutdown ----------
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(async (err) => {
    if (err) {
      logger.error('Error closing HTTP server', err);
    }

    try {
      await pool.end();
      logger.info('Database pool closed.');
      process.exit(err ? 1 : 0);
    } catch (poolErr) {
      logger.error('Error closing DB pool', poolErr);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

module.exports = server;
