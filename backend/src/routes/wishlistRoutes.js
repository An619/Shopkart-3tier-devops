const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', wishlistController.get);
router.post('/', wishlistController.add);
router.delete('/:id', wishlistController.remove);

module.exports = router;
