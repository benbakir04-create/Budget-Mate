// Default categories given to every new owner account (and used by prisma/seed.js).
const DEFAULT_CATEGORIES = [
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

module.exports = { DEFAULT_CATEGORIES };
