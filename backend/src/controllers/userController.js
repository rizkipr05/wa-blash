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
        isTelegramConnected: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update profile bank details
exports.updateProfile = async (req, res) => {
  const { bankName, accountNumber, accountHolder } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { bankName, accountNumber, accountHolder }
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
    const deviceCount = await prisma.whatsappDevice.count({ where: { userId } });
    const activeDeviceCount = await prisma.whatsappDevice.count({ where: { userId, status: 'CONNECTED' } });
    const referralCount = await prisma.user.count({ where: { referredBy: userId } });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });

    res.json({
      balance: user.balance,
      totalDevices: deviceCount,
      activeDevices: activeDeviceCount,
      totalReferrals: referralCount,
      totalEarnings: 0 // In a real app, calculate from transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};
