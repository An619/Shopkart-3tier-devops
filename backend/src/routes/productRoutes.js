const express = require('express');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public
router.get('/', productController.list);
router.get('/:id', productController.getById);
router.get('/:id/reviews', productController.listReviews);

// Authenticated
router.post('/:id/reviews', authMiddleware, productController.createReview);

// Admin
router.post('/', authMiddleware, roleMiddleware('admin'), productController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), productController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), productController.remove);

module.exports = router;
