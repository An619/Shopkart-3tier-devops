const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validationMiddleware');

const create = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 chars'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('discount').optional().isInt({ min: 0, max: 90 }).withMessage('Discount 0-90'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be >= 0'),
  body('categoryId').optional({ nullable: true }).isInt({ min: 1 }),
  validationMiddleware,
];

const update = [
  body('name').optional().trim().isLength({ min: 2, max: 200 }),
  body('price').optional().isFloat({ min: 0 }),
  body('discount').optional().isInt({ min: 0, max: 90 }),
  body('stock').optional().isInt({ min: 0 }),
  validationMiddleware,
];

module.exports = { productValidators: { create, update } };
