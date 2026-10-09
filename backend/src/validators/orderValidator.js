const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validationMiddleware');

const create = [
  body('shippingAddress').isObject().withMessage('shippingAddress object required'),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('fullName required'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('line1 required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('city required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('state required'),
  body('shippingAddress.postalCode').trim().notEmpty().withMessage('postalCode required'),
  body('paymentMethod').optional().isIn(['MOCK']).withMessage('Only MOCK supported'),
  validationMiddleware,
];

module.exports = { orderValidators: { create } };
