const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/list', authMiddleware, whatsappController.listDevices);
router.post('/add', authMiddleware, whatsappController.addDevice);
router.post('/:id/connect', authMiddleware, whatsappController.connectDevice);
router.get('/:id/status', authMiddleware, whatsappController.getDeviceStatus);
router.get('/:id/blast-progress', authMiddleware, whatsappController.getBlastProgress);
router.post('/:id/disconnect', authMiddleware, whatsappController.disconnectDevice);
router.delete('/:id', authMiddleware, whatsappController.deleteDevice);
router.post('/blast', authMiddleware, whatsappController.sendBlast);

module.exports = router;
