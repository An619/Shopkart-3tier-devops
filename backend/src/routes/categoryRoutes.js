const express = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public
router.get('/', categoryController.list);
router.get('/:id', categoryController.getById);

// Admin
router.post('/', authMiddleware, roleMiddleware('admin'), categoryController.create);
router.put('/:id', authMiddleware, roleMiddleware('admin'), categoryController.update);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), categoryController.remove);

module.exports = router;
