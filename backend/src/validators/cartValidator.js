const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validationMiddleware');

const add = [
  body('productId').isInt({ min: 1 }).withMessage('productId is required'),
  body('quantity').optional().isInt({ min: 1, max: 100 }),
  validationMiddleware,
];

const update = [
  body('quantity').isInt({ min: 1, max: 100 }).withMessage('quantity must be 1-100'),
  validationMiddleware,
];

module.exports = { cartValidators: { add, update } };
