const userModel = require('../models/userModel');
const password = require('../utils/password');
const jwt = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

async function register({ name, email, password: plain }) {
  const existing = await userModel.findByEmail(email);
  if (existing) throw ApiError.conflict('Email already registered');

  const passwordHash = await password.hash(plain);
  const user = await userModel.create({ name, email, passwordHash, role: 'user' });

  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email });
  return { token, user };
}

async function login({ email, password: plain }) {
  const user = await userModel.findByEmail(email);
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await password.compare(plain, user.password_hash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email });
  return { token, user: safeUser };
}

module.exports = { register, login };
