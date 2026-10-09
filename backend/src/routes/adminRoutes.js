const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/dashboard', adminController.dashboard);
router.get('/orders', adminController.listOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.get('/users', adminController.listUsers);

module.exports = router;
