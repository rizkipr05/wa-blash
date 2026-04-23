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
      qrCode: runtime?.qrCode || null
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
