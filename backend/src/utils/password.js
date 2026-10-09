const bcrypt = require('bcryptjs');
const config = require('../config');

async function hash(plain) {
  return bcrypt.hash(plain, config.bcryptSaltRounds);
}

async function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, compare };
