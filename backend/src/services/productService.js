const productModel = require('../models/productModel');
const reviewModel = require('../models/reviewModel');
const ApiError = require('../utils/ApiError');

async function list(filters) {
  return productModel.list(filters);
}

async function getById(id) {
  const product = await productModel.findById(id);
  if (!product) throw ApiError.notFound('Product not found');

  const stats = await reviewModel.statsForProduct(id);
  return {
    ...product,
    avgRating: Number(stats.avgRating),
    reviewCount: stats.reviewCount,
  };
}

async function create(data) {
  if (!data.name) throw ApiError.badRequest('Name is required');
  if (data.price == null) throw ApiError.badRequest('Price is required');
  return productModel.create(data);
}

async function update(id, data) {
  const updated = await productModel.update(id, data);
  if (!updated) throw ApiError.notFound('Product not found');
  return updated;
}

async function remove(id) {
  await productModel.remove(id);
}

async function listReviews(productId) {
  return reviewModel.listForProduct(productId);
}

async function createReview(productId, userId, data) {
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

module.exports = { list, getById, create, update, remove, listReviews, createReview };
