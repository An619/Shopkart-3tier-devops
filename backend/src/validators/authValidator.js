const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validationMiddleware');

const register = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 chars'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be 6-100 chars'),
  validationMiddleware,
];

const login = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validationMiddleware,
];

module.exports = { authValidators: { register, login } };
