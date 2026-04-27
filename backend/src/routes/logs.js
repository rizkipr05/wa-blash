const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/blast', authMiddleware, logController.getBlastLogs);

module.exports = router;
