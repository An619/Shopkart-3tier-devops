const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const healthController = require('./controllers/healthController');
const httpMetrics = require('./metrics/httpMetrics');

// Each deployment runs one bounded API surface. SERVICE_NAME is set by
// Compose/Kubernetes. "all" is retained for local development and rollback.
const domains = {
  identity: [['/auth', './routes/authRoutes'], ['/users', './routes/userRoutes']],
  catalog: [['/products', './routes/productRoutes'], ['/categories', './routes/categoryRoutes'], ['/reviews', './routes/reviewRoutes']],
  cart: [['/cart', './routes/cartRoutes']],
  wishlist: [['/wishlist', './routes/wishlistRoutes']],
  orders: [['/orders', './routes/orderRoutes']],
  admin: [['/admin', './routes/adminRoutes']],
};
const serviceName = process.env.SERVICE_NAME || 'all';
const app = express();

app.use(helmet());
const corsOrigins = (config.corsOrigin || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(requestLogger);
app.use('/api', httpMetrics);
app.get('/api/health', healthController.health);

if (serviceName === 'all') {
  app.use('/api', require('./routes'));
} else if (domains[serviceName]) {
  for (const [mountPath, modulePath] of domains[serviceName]) {
    app.use('/api' + mountPath, require(modulePath));
  }
} else {
  throw new Error('Unknown SERVICE_NAME "' + serviceName + '". Allowed: all, ' + Object.keys(domains).join(', '));
}

app.use(notFound);
app.use(errorHandler);
module.exports = app;
