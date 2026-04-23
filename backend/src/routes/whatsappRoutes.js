const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/list', authMiddleware, whatsappController.listDevices);
router.post('/add', authMiddleware, whatsappController.addDevice);
router.delete('/:id', authMiddleware, whatsappController.deleteDevice);

module.exports = router;
