const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get global stats for Admin Dashboard
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalDevices = await prisma.whatsAppDevice.count();
    const activeDevices = await prisma.whatsAppDevice.count({ where: { status: 'CONNECTED' } });
    
    const pendingWithdrawals = await prisma.withdrawal.count({ where: { status: 'PENDING' } });
    const pendingWithdrawalsSum = await prisma.withdrawal.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true }
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, createdAt: true, rank: true }
    });

    const recentWithdrawals = await prisma.withdrawal.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } }
    });

    res.json({
      totalUsers,
      totalDevices,
      activeDevices,
      pendingWithdrawals,
      pendingWithdrawalsAmount: pendingWithdrawalsSum._sum.amount || 0,
      recentUsers,
      recentWithdrawals
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
};
