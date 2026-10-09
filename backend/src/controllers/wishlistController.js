const wishlistService = require('../services/wishlistService');
const asyncHandler = require('../utils/asyncHandler');

const get = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.get(req.user.id);
  res.json(wishlist);
});

const add = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.add(req.user.id, req.body.productId);
  res.status(201).json(wishlist);
});

const remove = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.remove(req.user.id, Number(req.params.id));
  res.json(wishlist);
});

module.exports = { get, add, remove };
