const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// Get current user profile and stats
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        balance: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        referralCode: true,
        rank: true,
        role: true,
        isTelegramConnected: true,
        createdAt: true
      }
    });

    // Fetch Global Settings
    const settingsRaw = await prisma.systemSetting.findMany();
    const settings = settingsRaw.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, { msg_rate: '400', referral_commission: '50', min_withdraw: '10000' });

    res.json({ ...user, settings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update profile bank details & username
exports.updateProfile = async (req, res) => {
  const { username, bankName, accountNumber, accountHolder } = req.body;
  try {
    const updateData = { bankName, accountNumber, accountHolder };
    
    if (username) {
      if (username.length < 3) {
        return res.status(400).json({ message: 'Username minimal 3 karakter.' });
      }
      const existingUser = await prisma.user.findFirst({
        where: { username, id: { not: req.user.id } }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username sudah dipakai oleh pengguna lain.' });
      }
      updateData.username = username;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid old password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const deviceCount = await prisma.whatsAppDevice.count({ where: { userId } });
    const activeDeviceCount = await prisma.whatsAppDevice.count({ where: { userId, status: 'CONNECTED' } });
    const referralCount = await prisma.user.count({ where: { referredBy: userId } });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true, role: true } });
    
    // Fetch Global Settings
    const settingsRaw = await prisma.systemSetting.findMany();
    const settings = settingsRaw.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, { msg_rate: '400', referral_commission: '50', min_withdraw: '10000' }); // defaults

    // Calculate Total Earnings (Balance + All-time Withdrawals)
    const withdrawals = await prisma.withdrawal.aggregate({
      where: { userId },
      _sum: { amount: true }
    });
    const totalWithdrawn = withdrawals._sum.amount ? Number(withdrawals._sum.amount) : 0;
    const totalEarnings = Number(user.balance) + totalWithdrawn;

    res.json({
      user: { role: user.role }, // Adding this for Admin access
      balance: user.balance,
      totalDevices: deviceCount,
      activeDevices: activeDeviceCount,
      totalReferrals: referralCount,
      totalEarnings: totalEarnings,
      settings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};
