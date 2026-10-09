const {
  httpRequestsTotal,
  httpRequestDuration,
} = require('./promClient');

/**
 * Express middleware: records count + duration for each request.
 * Route label uses req.route?.path when available for low cardinality.
 */
function httpMetrics(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = (req.route && req.route.path) || req.baseUrl || req.path || 'unknown';
    const labels = {
      method: req.method,
      route,
      status: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, seconds);
  });

  next();
}

module.exports = httpMetrics;
