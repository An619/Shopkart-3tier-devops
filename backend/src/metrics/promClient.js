const client = require('prom-client');

const register = new client.Registry();

// Default process metrics: CPU, memory, event loop lag, etc.
client.collectDefaultMetrics({
  register,
  prefix: 'shopkart_backend_',
});

// ---------- Custom app metrics ----------
const httpRequestsTotal = new client.Counter({
  name: 'shopkart_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'shopkart_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const ordersCreatedTotal = new client.Counter({
  name: 'shopkart_orders_created_total',
  help: 'Total orders created',
  registers: [register],
});

const cartAddsTotal = new client.Counter({
  name: 'shopkart_cart_adds_total',
  help: 'Total add-to-cart operations',
  registers: [register],
});

module.exports = {
  client,
  register,
  httpRequestsTotal,
  httpRequestDuration,
  ordersCreatedTotal,
  cartAddsTotal,
};
