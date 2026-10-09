class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message || 'Bad request', details);
  }
  static unauthorized(message) {
    return new ApiError(401, message || 'Unauthorized');
  }
  static forbidden(message) {
    return new ApiError(403, message || 'Forbidden');
  }
  static notFound(message) {
    return new ApiError(404, message || 'Not found');
  }
  static conflict(message) {
    return new ApiError(409, message || 'Conflict');
  }
  static internal(message) {
    return new ApiError(500, message || 'Internal server error');
  }
}

module.exports = ApiError;
