const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const adminDashboardController = require('../controllers/adminDashboardController');
const adminUserController = require('../controllers/adminUserController');
const adminWithdrawalController = require('../controllers/adminWithdrawalController');

// All admin routes are protected by both auth and admin middlewares
router.use(authMiddleware, adminMiddleware);

// Dashboard Stats & Settings
router.get('/stats', adminDashboardController.getAdminStats);

const adminSettingsController = require('../controllers/adminSettingsController');
router.get('/settings', adminSettingsController.getSettings);
router.put('/settings', adminSettingsController.updateSettings);

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

router.post('/template', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pp', maxCount: 1 }]), adminSettingsController.updateTemplate);

// User Management
router.get('/users', adminUserController.getAllUsers);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);

// Withdrawal Management
router.get('/withdrawals', adminWithdrawalController.getAllWithdrawals);
router.put('/withdrawals/:id/process', adminWithdrawalController.processWithdrawal);

module.exports = router;
