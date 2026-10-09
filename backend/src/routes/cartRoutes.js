const express = require('express');
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', cartController.get);
router.post('/', cartController.add);
router.put('/:id', cartController.update);
router.delete('/:id', cartController.remove);
router.delete('/', cartController.clear);

module.exports = router;
