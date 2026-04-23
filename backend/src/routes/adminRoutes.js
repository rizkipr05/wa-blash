const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const adminDashboardController = require('../controllers/adminDashboardController');
const adminUserController = require('../controllers/adminUserController');
const adminWithdrawalController = require('../controllers/adminWithdrawalController');

// All admin routes are protected by both auth and admin middlewares
router.use(authMiddleware, adminMiddleware);

// Dashboard Stats
router.get('/stats', adminDashboardController.getAdminStats);

// User Management
router.get('/users', adminUserController.getAllUsers);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);

// Withdrawal Management
router.get('/withdrawals', adminWithdrawalController.getAllWithdrawals);
router.put('/withdrawals/:id/process', adminWithdrawalController.processWithdrawal);

module.exports = router;
