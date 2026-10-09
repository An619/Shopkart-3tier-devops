const reviewService = require('../services/reviewService');
const asyncHandler = require('../utils/asyncHandler');

const listForProduct = asyncHandler(async (req, res) => {
  const reviews = await reviewService.listForProduct(Number(req.params.productId));
  res.json({ reviews });
});

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.create(
    Number(req.params.productId),
    req.user.id,
    req.body
  );
  res.status(201).json(review);
});

const remove = asyncHandler(async (req, res) => {
  await reviewService.remove(Number(req.params.id), req.user.id);
  res.status(204).end();
});

module.exports = { listForProduct, create, remove };
