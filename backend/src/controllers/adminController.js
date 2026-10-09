const orderService = require('../services/orderService');
const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

const dashboard = asyncHandler(async (_req, res) => {
  const stats = await orderService.dashboard();
  res.json(stats);
});

const listOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listAll({
    limit: req.query.limit ? Number(req.query.limit) : 100,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });
  res.json(result);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(Number(req.params.id), req.body.status);
  res.json({ order });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers({
    limit: req.query.limit ? Number(req.query.limit) : 100,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });
  res.json({ users });
});

module.exports = { dashboard, listOrders, updateOrderStatus, listUsers };
