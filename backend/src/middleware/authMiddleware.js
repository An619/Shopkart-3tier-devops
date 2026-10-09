const jwt = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

function authMiddleware(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const payload = jwt.verify(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

module.exports = authMiddleware;
