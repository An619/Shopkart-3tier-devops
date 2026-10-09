const express = require('express');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { productValidators } = require('../validators/productValidator');

const router = express.Router();

// Public
router.get('/', productController.list);
router.get('/:id', productController.getById);
router.get('/:id/reviews', productController.listReviews);

// Authenticated
router.post('/:id/reviews', authMiddleware, productController.createReview);

// Admin
router.post('/', authMiddleware, roleMiddleware('admin'), productValidators.create, productController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), productValidators.update, productController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), productController.remove);

module.exports = router;
