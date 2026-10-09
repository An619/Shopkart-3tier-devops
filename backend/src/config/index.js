require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',

  // ---------- Database ----------
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'shopkart',
    user: process.env.DB_USER || 'shopkart_user',
    password: process.env.DB_PASSWORD || '',
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },

  // ---------- JWT ----------
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_change_me_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // ---------- bcrypt ----------
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  // ---------- CORS ----------
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

module.exports = config;
