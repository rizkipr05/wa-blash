const express = require('express');
const authController = require('../controllers/authController');
const authLimiter = require('../middleware/ratelimit');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/admin-login', authLimiter, authController.adminLogin);

module.exports = router;
