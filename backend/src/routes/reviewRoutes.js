const express = require('express');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.delete('/:id', authMiddleware, reviewController.remove);

module.exports = router;
