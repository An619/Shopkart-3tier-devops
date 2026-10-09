const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validationMiddleware(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  next();
}

module.exports = validationMiddleware;
