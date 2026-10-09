const prom = require('./promClient');
const httpMetrics = require('./httpMetrics');

module.exports = {
  register: prom.register,
  httpMetrics,
  ordersCreatedTotal: prom.ordersCreatedTotal,
  cartAddsTotal: prom.cartAddsTotal,
};
