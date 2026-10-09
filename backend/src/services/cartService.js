const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const ApiError = require('../utils/ApiError');
const { cartAddsTotal } = require('../metrics/promClient');

async function get(userId) {
  const items = await cartModel.getItems(userId);
  return { items };
}

async function add(userId, { productId, quantity }) {
  if (!productId) throw ApiError.badRequest('productId is required');
  const qty = Number(quantity) || 1;
  const product = await productModel.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.stock != null && product.stock < qty) {
    throw ApiError.badRequest('Insufficient stock');
  }
  cartAddsTotal.inc();
  const items = await cartModel.addItem(userId, { productId, quantity: qty });
  return { items };
}

async function update(userId, itemId, { quantity }) {
  const qty = Number(quantity);
  if (!qty || qty < 1) throw ApiError.badRequest('quantity must be >= 1');
  const items = await cartModel.updateItem(userId, itemId, qty);
  return { items };
}

async function remove(userId, itemId) {
  const items = await cartModel.removeItem(userId, itemId);
  return { items };
}

async function clear(userId) {
  await cartModel.clear(userId);
  return { items: [] };
}

module.exports = { get, add, update, remove, clear };
