const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ensureDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return;

  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = process.env.MYSQL_PORT || '3306';

  if (!user || !password || !database) {
    throw new Error(
      'DATABASE_URL is missing. Set DATABASE_URL or MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.'
    );
  }

  process.env.DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${database}`;
};

const randomReferralCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return regex.test(password);
};

async function seedAdmin() {
  ensureDatabaseUrl();

  const username = process.env.ADMIN_USERNAME || 'administrator';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  if (!validatePassword(password)) {
    throw new Error(
      'ADMIN_PASSWORD is too weak. Use at least 8 chars with uppercase, lowercase, number, and special char.'
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (existingUser) {
    await prisma.user.update({
      where: { username },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
  } else {
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
        referralCode: randomReferralCode(),
      },
    });
  }

  console.log('ADMIN_SEED_SUCCESS');
  console.log(`username=${username}`);
  console.log('password=<hidden>');
}

seedAdmin()
  .catch((error) => {
    console.error('ADMIN_SEED_FAILED');
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
