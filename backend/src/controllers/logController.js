const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBlastLogs = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Admin can see all logs, users only their own
    const where = {};
    if (role !== 'ADMIN') {
      where.userId = userId;
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

    const [logs, total] = await Promise.all([
      prisma.blastLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.blastLog.count({ where })
    ]);

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
