const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { orderValidators } = require('../validators/orderValidator');

const router = express.Router();

router.use(authMiddleware);

router.post('/', orderValidators.create, orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.getById);
router.put('/:id/cancel', orderController.cancel);

module.exports = router;
