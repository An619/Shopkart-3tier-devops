const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error('Unhandled server error', err);
  } else {
    logger.warn('Request error', { path: req.path, message, statusCode });
  }

  const body = {
    message,
    statusCode,
  };
  if (isApiError && err.details) body.details = err.details;

  res.status(statusCode).json(body);
}

module.exports = { errorHandler };
