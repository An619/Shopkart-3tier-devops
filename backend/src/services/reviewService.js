const reviewModel = require('../models/reviewModel');
const ApiError = require('../utils/ApiError');

async function listForProduct(productId) {
  return reviewModel.listForProduct(productId);
}

async function create(productId, userId, data) {
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    throw ApiError.badRequest('Rating must be between 1 and 5');
  }
  return reviewModel.create({
    productId,
    userId,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
  });
}

async function remove(reviewId, userId) {
  await reviewModel.remove(reviewId, userId);
}

module.exports = { listForProduct, create, remove };
