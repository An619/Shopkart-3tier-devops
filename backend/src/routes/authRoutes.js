const express = require('express');
const authController = require('../controllers/authController');
const { authValidators } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', authValidators.register, authController.register);
router.post('/login', authValidators.login, authController.login);

module.exports = router;
