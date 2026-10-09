const cartService = require('../services/cartService');
const asyncHandler = require('../utils/asyncHandler');

const get = asyncHandler(async (req, res) => {
  const cart = await cartService.get(req.user.id);
  res.json(cart);
});

const add = asyncHandler(async (req, res) => {
  const cart = await cartService.add(req.user.id, req.body);
  res.status(201).json(cart);
});

const update = asyncHandler(async (req, res) => {
  const cart = await cartService.update(req.user.id, Number(req.params.id), req.body);
  res.json(cart);
});

const remove = asyncHandler(async (req, res) => {
  const cart = await cartService.remove(req.user.id, Number(req.params.id));
  res.json(cart);
});

const clear = asyncHandler(async (req, res) => {
  const cart = await cartService.clear(req.user.id);
  res.json(cart);
});

module.exports = { get, add, update, remove, clear };
