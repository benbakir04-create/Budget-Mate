const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const { DEFAULT_CATEGORIES: categories } = require('../src/constants/defaultCategories');

async function main() {
  console.log('🌱 Seeding default categories...');

  const systemUserId = 'seed-default-user';

  // Ensure a placeholder user to attach default categories (will be copied per user as needed).
  const hashed = await bcrypt.hash('seed-password', 10);

  await prisma.user.upsert({
    where: { id: systemUserId },
    update: {},
    create: {
      id: systemUserId,
      email: 'seed@budgetmate.local',
      password: hashed,
      name: 'Seed User',
      currency: 'SAR',
      language: 'ar',
    },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { userId_name: { userId: systemUserId, name: category.name } },
      update: {},
      create: { ...category, userId: systemUserId },
    });
  }

  console.log('✅ Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
