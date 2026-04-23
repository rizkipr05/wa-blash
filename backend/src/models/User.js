const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class User {
  static async findByUsername(username) {
    return await prisma.user.findUnique({ where: { username } });
  }

  static async create(data) {
    return await prisma.user.create({ data });
  }

  static async findById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }
}

module.exports = User;
