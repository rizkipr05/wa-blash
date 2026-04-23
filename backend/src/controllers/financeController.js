const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Request withdrawal
exports.requestWithdraw = async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (parseFloat(user.balance) < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (!user.bankName || !user.accountNumber) {
      return res.status(400).json({ message: 'Please set bank details in profile first' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: req.user.id,
        amount: parseFloat(amount),
        bankDetails: {
          bankName: user.bankName,
          accountNumber: user.accountNumber,
          accountHolder: user.accountHolder
        },
        status: 'PENDING'
      }
    });

    // Subtract balance
    await prisma.user.update({
      where: { id: req.user.id },
      data: { balance: { decrement: parseFloat(amount) } }
    });

    // Log transaction
    await prisma.transaction.create({
      data: {
        userId: req.user.id,
        amount: parseFloat(amount),
        type: 'WITHDRAWAL',
        description: `Withdrawal request #${withdrawal.id}`
      }
    });

    res.json({ message: 'Withdrawal request submitted', withdrawal });
  } catch (error) {
    res.status(500).json({ message: 'Error processing withdrawal', error: error.message });
  }
};

// Get withdrawal history
exports.withdrawHistory = async (req, res) => {
  try {
    const history = await prisma.withdrawal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
};

// List referrals
exports.referralList = async (req, res) => {
  try {
    const referrals = await prisma.user.findMany({
      where: { referredBy: req.user.id },
      select: {
        username: true,
        createdAt: true,
        rank: true
      }
    });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching referrals', error: error.message });
  }
};
