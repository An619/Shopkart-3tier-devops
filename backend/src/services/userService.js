const userModel = require('../models/userModel');
const password = require('../utils/password');
const ApiError = require('../utils/ApiError');

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function updateProfile(userId, data) {
  if (data.email) {
    const existing = await userModel.findByEmail(data.email);
    if (existing && existing.id !== userId) {
      throw ApiError.conflict('Email already in use');
    }
  }
  const updated = await userModel.update(userId, data);
  if (!updated) throw ApiError.notFound('User not found');
  return updated;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userModel.findByEmail(
    (await userModel.findById(userId))?.email || ''
  );
  if (!user) throw ApiError.notFound('User not found');

  const ok = await password.compare(currentPassword, user.password_hash);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');

  const hash = await password.hash(newPassword);
  await userModel.updatePassword(userId, hash);
}

async function listUsers({ limit, offset } = {}) {
  return userModel.list({ limit, offset });
}

module.exports = { getProfile, updateProfile, changePassword, listUsers };
