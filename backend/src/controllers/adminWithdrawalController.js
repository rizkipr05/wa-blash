const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all withdrawals
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, balance: true }
        }
      }
    });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching withdrawals', error: error.message });
  }
};

// Approve or Reject a withdrawal
exports.processWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'

  try {
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ message: 'Withdrawal is already processed' });
    }

    // Execute transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Update the withdrawal status
      await tx.withdrawal.update({
        where: { id: parseInt(id) },
        data: { status }
      });

      // 2. If rejected, refund the user's balance
      if (status === 'REJECTED') {
        const refundAmount = parseFloat(withdrawal.amount) + 5000; // Original amount + approx fee refund
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            balance: {
              increment: refundAmount
            }
          }
        });

        // 3. Optional: log the refund as a transaction
         await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            amount: refundAmount,
            type: 'REFUND',
            description: 'Withdrawal rejected refund'
          }
        });
      }
    });

    res.json({ message: `Withdrawal successfully ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Error processing withdrawal', error: error.message });
  }
};
