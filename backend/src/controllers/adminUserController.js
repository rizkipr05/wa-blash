const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all users with their stats
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { devices: true, withdrawals: true, referrals: true }
        }
      }
    });
    
    // Anonymize passwords and return
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Edit a user (e.g., change rank or balance)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { rank, balance } = req.body;
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        rank,
        ...(balance !== undefined && { balance })
      }
    });
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Delete related records first to maintain referential integrity
    await prisma.whatsappDevice.deleteMany({ where: { userId: parseInt(id) } });
    await prisma.withdrawal.deleteMany({ where: { userId: parseInt(id) } });
    await prisma.transaction.deleteMany({ where: { userId: parseInt(id) } });
    
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
