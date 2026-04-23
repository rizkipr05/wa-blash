const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/withdraw', authMiddleware, financeController.requestWithdraw);
router.get('/withdraw/history', authMiddleware, financeController.withdrawHistory);
router.get('/referrals', authMiddleware, financeController.referralList);

module.exports = router;
