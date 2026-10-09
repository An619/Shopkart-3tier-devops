const express = require('express');
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');
const { cartValidators } = require('../validators/cartValidator');

const router = express.Router();

router.use(authMiddleware);

router.get('/', cartController.get);
router.post('/', cartValidators.add, cartController.add);
router.put('/:id', cartValidators.update, cartController.update);
router.delete('/:id', cartController.remove);
router.delete('/', cartController.clear);

module.exports = router;
