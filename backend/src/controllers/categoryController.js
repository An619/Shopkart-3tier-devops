const categoryService = require('../services/categoryService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (_req, res) => {
  const categories = await categoryService.list();
  res.json({ categories });
});

const getById = asyncHandler(async (req, res) => {
  const category = await categoryService.getById(Number(req.params.id));
  res.json(category);
});

const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  res.status(201).json(category);
});

const update = asyncHandler(async (req, res) => {
  const category = await categoryService.update(Number(req.params.id), req.body);
  res.json(category);
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(Number(req.params.id));
  res.status(204).end();
});

module.exports = { list, getById, create, update, remove };
