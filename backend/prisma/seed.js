const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categories = [
  // Expense
  { name: 'Food & Dining', nameAr: 'طعام وشراب', icon: '🍔', color: '#EF4444', type: 'expense' },
  { name: 'Transportation', nameAr: 'مواصلات', icon: '🚗', color: '#F59E0B', type: 'expense' },
  { name: 'Shopping', nameAr: 'تسوق', icon: '🛍️', color: '#8B5CF6', type: 'expense' },
  { name: 'Bills & Utilities', nameAr: 'فواتير', icon: '💡', color: '#3B82F6', type: 'expense' },
  { name: 'Healthcare', nameAr: 'صحة', icon: '🏥', color: '#10B981', type: 'expense' },
  { name: 'Education', nameAr: 'تعليم', icon: '📚', color: '#F97316', type: 'expense' },
  { name: 'Entertainment', nameAr: 'ترفيه', icon: '🎬', color: '#EC4899', type: 'expense' },
  { name: 'Other Expense', nameAr: 'مصروف آخر', icon: '📦', color: '#6B7280', type: 'expense' },
  // Income
  { name: 'Salary', nameAr: 'راتب', icon: '💰', color: '#10B981', type: 'income' },
  { name: 'Freelance', nameAr: 'عمل حر', icon: '💼', color: '#3B82F6', type: 'income' },
  { name: 'Investments', nameAr: 'استثمارات', icon: '📈', color: '#8B5CF6', type: 'income' },
  { name: 'Other Income', nameAr: 'دخل آخر', icon: '💵', color: '#6B7280', type: 'income' }
];

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
      language: 'ar'
    }
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { userId_name: { userId: systemUserId, name: category.name } },
      update: {},
      create: { ...category, userId: systemUserId }
    });
  }

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

