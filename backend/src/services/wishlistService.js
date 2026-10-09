const wishlistModel = require('../models/wishlistModel');
const productModel = require('../models/productModel');
const ApiError = require('../utils/ApiError');

async function get(userId) {
  const items = await wishlistModel.getItems(userId);
  return { items };
}

async function add(userId, productId) {
  if (!productId) throw ApiError.badRequest('productId is required');
  const product = await productModel.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  const items = await wishlistModel.add(userId, productId);
  return { items };
}

async function remove(userId, itemId) {
  const items = await wishlistModel.remove(userId, itemId);
  return { items };
}

module.exports = { get, add, remove };
