const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAndLog() {
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    console.log("NO_USERS_FOUND");
    return;
  }
  
  const user = users[0];
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, role: 'ADMIN' }
  });
  
  console.log("SUCCESS:");
  console.log("Username:", user.username);
  console.log("Password:", "admin123");
}

resetAndLog().catch(console.error).finally(() => prisma.$disconnect());
