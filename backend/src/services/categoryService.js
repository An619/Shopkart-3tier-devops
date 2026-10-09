const categoryModel = require('../models/categoryModel');
const ApiError = require('../utils/ApiError');

async function list() {
  return categoryModel.list();
}

async function getById(id) {
  const cat = await categoryModel.findById(id);
  if (!cat) throw ApiError.notFound('Category not found');
  return cat;
}

async function create(data) {
  if (!data.name) throw ApiError.badRequest('Name is required');
  return categoryModel.create(data);
}

async function update(id, data) {
  const updated = await categoryModel.update(id, data);
  if (!updated) throw ApiError.notFound('Category not found');
  return updated;
}

async function remove(id) {
  await categoryModel.remove(id);
}

module.exports = { list, getById, create, update, remove };
