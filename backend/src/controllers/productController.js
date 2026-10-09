const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await productService.list({
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    search: req.query.search,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    sort: req.query.sort,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    offset: req.query.offset ? Number(req.query.offset) : 0,
  });
  res.json(result);
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(Number(req.params.id));
  res.json(product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json(product);
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(Number(req.params.id), req.body);
  res.json(product);
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(Number(req.params.id));
  res.status(204).end();
});

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await productService.listReviews(Number(req.params.id));
  res.json({ reviews });
});

const createReview = asyncHandler(async (req, res) => {
  const review = await productService.createReview(
    Number(req.params.id),
    req.user.id,
    req.body
  );
  res.status(201).json(review);
});

module.exports = { list, getById, create, update, remove, listReviews, createReview };
