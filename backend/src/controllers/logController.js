const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBlastLogs = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true }
    });

    const skip = (page - 1) * limit;
    
    // Admin can see all logs, users only their own
    const where = {};
    if (requester?.role !== 'ADMIN') {
      where.userId = requesterId;
    }
    
    if (search) {
      where.OR = [
        { target: { contains: search } },
        { message: { contains: search } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const [rawLogs, total] = await Promise.all([
      prisma.blastLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.blastLog.count({ where })
    ]);

    const userIds = [...new Set(rawLogs.map((log) => log.userId).filter(Boolean))];
    const deviceIds = [...new Set(rawLogs.map((log) => log.deviceId).filter(Boolean))];

    const [users, devices] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true }
          })
        : [],
      deviceIds.length > 0
        ? prisma.whatsAppDevice.findMany({
            where: { id: { in: deviceIds } },
            select: { id: true, phoneNumber: true }
          })
        : []
    ]);

    const userMap = new Map(users.map((user) => [user.id, user]));
    const deviceMap = new Map(devices.map((device) => [device.id, device]));
    const logs = rawLogs.map((log) => {
      const user = userMap.get(log.userId);
      const device = deviceMap.get(log.deviceId);
      const senderLabelParts = [];

      if (user?.username) {
        senderLabelParts.push(`Akun: ${user.username}`);
      }

      if (device?.phoneNumber) {
        senderLabelParts.push(`Pengirim: +${device.phoneNumber}`);
      } else if (log.deviceId) {
        senderLabelParts.push(`Device: #${log.deviceId}`);
      }

      const senderLabel = senderLabelParts.length > 0
        ? senderLabelParts.join(' • ')
        : 'Pengirim tidak diketahui';

      return {
        ...log,
        username: user?.username || null,
        senderPhoneNumber: device?.phoneNumber || null,
        senderDeviceId: log.deviceId || null,
        senderLabel
      };
    });

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blast logs', error: error.message });
  }
};
