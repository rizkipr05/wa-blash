const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tableRows = await prisma.$queryRaw`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BlastLog'
    LIMIT 1
  `;

  if (!tableRows.length) {
    console.log('BlastLog table not found. Skipping duplicate cleanup.');
    return;
  }

  const duplicateRows = await prisma.$queryRaw`
    SELECT userId, target, COUNT(*) AS duplicateCount
    FROM BlastLog
    GROUP BY userId, target
    HAVING COUNT(*) > 1
  `;

  if (!duplicateRows.length) {
    console.log('No duplicate BlastLog rows found.');
    return;
  }

  const deletedRows = await prisma.$executeRawUnsafe(`
    DELETE bl1
    FROM BlastLog bl1
    INNER JOIN BlastLog bl2
      ON bl1.userId = bl2.userId
      AND bl1.target = bl2.target
      AND bl1.id > bl2.id
  `);

  console.log(`Removed ${deletedRows} duplicate BlastLog rows before schema sync.`);
}

main()
  .catch((error) => {
    console.error('Failed to prepare BlastLog unique data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
