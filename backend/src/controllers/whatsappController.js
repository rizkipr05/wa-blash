const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List all devices
exports.listDevices = async (req, res) => {
  try {
    const devices = await prisma.whatsappDevice.findMany({
      where: { userId: req.user.id }
    });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Error listing devices', error: error.message });
  }
};

// Add new device (Mock)
exports.addDevice = async (req, res) => {
  try {
    const device = await prisma.whatsappDevice.create({
      data: {
        userId: req.user.id,
        status: 'DISCONNECTED'
      }
    });
    res.json({ message: 'Device added. Please scan QR to connect.', device });
  } catch (error) {
    res.status(500).json({ message: 'Error adding device', error: error.message });
  }
};

// Delete device
exports.deleteDevice = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.whatsappDevice.delete({
      where: { id: parseInt(id), userId: req.user.id }
    });
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting device', error: error.message });
  }
};
