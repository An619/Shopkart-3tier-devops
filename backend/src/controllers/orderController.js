const orderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const order = await orderService.create(req.user.id, req.body);
  res.status(201).json({ order });
});

const list = asyncHandler(async (req, res) => {
  const result = await orderService.listForUser(req.user.id, {
    limit: req.query.limit ? Number(req.query.limit) : 50,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });
  res.json(result);
});

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.getById(req.user.id, Number(req.params.id));
  res.json({ order });
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancel(req.user.id, Number(req.params.id));
  res.json({ order });
});

module.exports = { create, list, getById, cancel };
