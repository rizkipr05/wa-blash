const { PrismaClient } = require('@prisma/client');
const whatsappService = require('../services/whatsappService');

const prisma = new PrismaClient();

const getUserDevice = async (userId, deviceId) => {
  return prisma.whatsAppDevice.findFirst({
    where: {
      id: deviceId,
      userId
    }
  });
};

exports.listDevices = async (req, res) => {
  try {
    const devices = await prisma.whatsAppDevice.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'desc' }
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Error listing devices', error: error.message });
  }
};

exports.addDevice = async (req, res) => {
  try {
    const device = await prisma.whatsAppDevice.create({
      data: {
        userId: req.user.id,
        status: 'DISCONNECTED'
      }
    });

    const runtime = await whatsappService.connectDevice(device, {
      method: req.body.method,
      phoneNumber: req.body.phoneNumber
    });

    res.json({
      message: 'Device added. Scan QR untuk menyambungkan WhatsApp.',
      device,
      runtime
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding device', error: error.message });
  }
};

exports.connectDevice = async (req, res) => {
  const deviceId = parseInt(req.params.id, 10);

  try {
    const device = await getUserDevice(req.user.id, deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const runtime = await whatsappService.connectDevice(device, {
      method: req.body.method,
      phoneNumber: req.body.phoneNumber
    });
    res.json({ message: 'Connection started', runtime });
  } catch (error) {
    res.status(500).json({ message: 'Error connecting device', error: error.message });
  }
};

exports.getDeviceStatus = async (req, res) => {
  const deviceId = parseInt(req.params.id, 10);

  try {
    const device = await getUserDevice(req.user.id, deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const runtime = await whatsappService.getDeviceStatus(device.id);

    res.json({
      id: device.id,
      status: runtime?.status || device.status,
      phoneNumber: runtime?.phoneNumber || device.phoneNumber,
      qrCode: runtime?.qrCode || null,
      pairingCode: runtime?.pairingCode || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching device status', error: error.message });
  }
};

exports.disconnectDevice = async (req, res) => {
  const deviceId = parseInt(req.params.id, 10);

  try {
    const device = await getUserDevice(req.user.id, deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    await whatsappService.disconnectDevice(device);
    res.json({ message: 'Device disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error disconnecting device', error: error.message });
  }
};

exports.deleteDevice = async (req, res) => {
  const deviceId = parseInt(req.params.id, 10);

  try {
    const device = await getUserDevice(req.user.id, deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    await whatsappService.disconnectDevice(device);
    await whatsappService.destroyDeviceSession(req.user.id, device.id);

    await prisma.whatsAppDevice.delete({
      where: { id: device.id }
    });

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting device', error: error.message });
  }
};

exports.sendBlast = async (req, res) => {
  const { deviceId, speed } = req.body;

  try {
    const device = await getUserDevice(req.user.id, deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found or not owned by you' });
    }

    if (device.status !== 'CONNECTED') {
      return res.status(400).json({ message: 'WhatsApp device must be in CONNECTED status' });
    }

    const targetSetting = await prisma.systemSetting.findUnique({ where: { key: 'global_target_numbers' } });
    if (!targetSetting || !targetSetting.value || targetSetting.value.trim() === '') {
      return res.status(400).json({ message: 'Admin belum menyiapkan Database Nomor Target. Tidak dapat mengirim Blast.' });
    }

    const targets = targetSetting.value.split(/[\n,]+/).map(t => t.trim()).filter(t => t);
    
    if (targets.length === 0) {
      return res.status(400).json({ message: 'Nomor Target Global kosong atau tidak valid.' });
    }

    const templateSetting = await prisma.systemSetting.findUnique({ where: { key: 'global_message_template' } });
    const message = templateSetting ? templateSetting.value : 'Halo, pesan dari sistem.';

    const imgSetting = await prisma.systemSetting.findUnique({ where: { key: 'global_image_url' } });
    const imageUrl = imgSetting && imgSetting.value !== '' ? imgSetting.value : null;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Admin has not configured a valid template message yet' });
    }

    const antibanDailyLimit = await prisma.systemSetting.findUnique({ where: { key: 'antiban_daily_limit' } });
    const antibanBatchSize = await prisma.systemSetting.findUnique({ where: { key: 'antiban_batch_size' } });
    const antibanBatchDelay = await prisma.systemSetting.findUnique({ where: { key: 'antiban_batch_delay' } });
    const antibanFailureLimit = await prisma.systemSetting.findUnique({ where: { key: 'antiban_failure_limit' } });
    const msgRateSetting = await prisma.systemSetting.findUnique({ where: { key: 'msg_rate' } });

    const firewall = {
      dailyLimit: antibanDailyLimit?.value ? parseInt(antibanDailyLimit.value, 10) : 200,
      batchSize: antibanBatchSize?.value ? parseInt(antibanBatchSize.value, 10) : 50,
      batchDelayMinutes: antibanBatchDelay?.value ? parseInt(antibanBatchDelay.value, 10) : 5,
      failureLimitPercent: antibanFailureLimit?.value ? parseInt(antibanFailureLimit.value, 10) : 20,
      msgRate: msgRateSetting?.value ? parseFloat(msgRateSetting.value) : 400
    };

    const buttonTextSetting = await prisma.systemSetting.findUnique({ where: { key: 'global_button_text' } });
    const buttonUrlSetting = await prisma.systemSetting.findUnique({ where: { key: 'global_button_url' } });
    const buttonText = buttonTextSetting?.value || null;
    const buttonUrl = buttonUrlSetting?.value || null;

    whatsappService.blastMessages(device.id, targets, message, speed || 'normal', imageUrl, firewall, buttonText, buttonUrl).catch(err => {
      console.error('Background blast error:', err.message);
    });

    res.json({ message: 'Berhasil memulai pengiriman blast di latar belakang', count: targets.length });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memulai blast', error: error.message });
  }
};
