const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const paymentService = require('./paymentService');
const ApiError = require('../utils/ApiError');
const { ordersCreatedTotal } = require('../metrics/promClient');

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_FEE = 49;

async function create(userId, { shippingAddress, paymentMethod = 'MOCK' }) {
  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.line1) {
    throw ApiError.badRequest('Shipping address is incomplete');
  }

  const cartItems = await cartModel.getItems(userId);
  if (!cartItems.length) throw ApiError.badRequest('Cart is empty');

  // Validate stock
  for (const it of cartItems) {
    const p = await productModel.findById(it.productId);
    if (!p) throw ApiError.badRequest(`Product ${it.productId} no longer exists`);
    if (p.stock != null && p.stock < it.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${p.name}`);
    }
  }

  const subtotal = cartItems.reduce(
    (s, it) => s + Number(it.price) * it.quantity,
    0
  );
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  // Simulated payment authorization
  const paymentResult = await paymentService.authorize({ amount: total, method: paymentMethod });
  if (!paymentResult.ok) throw ApiError.badRequest('Payment failed (simulated)');

  const orderId = await orderModel.createWithItems(userId, {
    items: cartItems.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      price: it.price,
      productName: it.product?.name,
    })),
    shippingAddress,
    paymentMethod,
    totals: { subtotal, shipping, total },
  });

  await cartModel.clear(userId);
  ordersCreatedTotal.inc();

  return getById(userId, orderId);
}

async function listForUser(userId, params) {
  const orders = await orderModel.listForUser(userId, params);
  return { orders };
}

async function getById(userId, orderId) {
  const order = await orderModel.findByIdForUser(userId, orderId);
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

async function cancel(userId, orderId) {
  await orderModel.cancel(userId, orderId);
  return getById(userId, orderId);
}

async function listAll(params) {
  const orders = await orderModel.listAll(params);
  return { orders };
}

async function updateStatus(orderId, status) {
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) throw ApiError.badRequest('Invalid status');
  const order = await orderModel.updateStatus(orderId, status);
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

async function dashboard() {
  return orderModel.dashboardStats();
}

module.exports = { create, listForUser, getById, cancel, listAll, updateStatus, dashboard };
