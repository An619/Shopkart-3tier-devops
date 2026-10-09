const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// ---------- Security ----------
app.use(helmet());

// ---------- CORS ----------
const corsOrigins = (config.corsOrigin || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
);

// ---------- Body parsing ----------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Logging ----------
app.use(morgan('combined'));
app.use(requestLogger);

// ---------- Routes ----------
app.use('/api', routes);

// ---------- 404 ----------
app.use(notFound);

// ---------- Centralized error handler (must be last) ----------
app.use(errorHandler);

module.exports = app;
