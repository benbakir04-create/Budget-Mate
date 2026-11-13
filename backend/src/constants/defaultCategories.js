// Default categories given to every new owner account (and used by prisma/seed.js).
// Chosen for an Algerian household, the first launch market.
const DEFAULT_CATEGORIES = [
  // Expense
  { name: 'Groceries', nameAr: 'السوق والخضر', icon: '🥬', color: '#22C55E', type: 'expense' },
  { name: 'Bread & Milk', nameAr: 'الخبز والحليب', icon: '🥖', color: '#F59E0B', type: 'expense' },
  { name: 'Rent', nameAr: 'الكراء', icon: '🏠', color: '#8B5CF6', type: 'expense' },
  {
    name: 'Electricity & Gas',
    nameAr: 'الكهرباء والغاز',
    icon: '💡',
    color: '#3B82F6',
    type: 'expense',
  },
  { name: 'Water', nameAr: 'الماء', icon: '🚰', color: '#06B6D4', type: 'expense' },
  {
    name: 'Internet & Phone',
    nameAr: 'الإنترنت والهاتف',
    icon: '📶',
    color: '#6366F1',
    type: 'expense',
  },
  { name: 'Transport', nameAr: 'النقل والوقود', icon: '🚗', color: '#F97316', type: 'expense' },
  { name: 'School', nameAr: 'المدرسة والدروس', icon: '📚', color: '#0EA5E9', type: 'expense' },
  { name: 'Health', nameAr: 'الصحة والدواء', icon: '💊', color: '#10B981', type: 'expense' },
  { name: 'Clothing', nameAr: 'الملابس', icon: '👕', color: '#EC4899', type: 'expense' },
  { name: 'Ramadan', nameAr: 'رمضان', icon: '🌙', color: '#A855F7', type: 'expense' },
  {
    name: 'Occasions',
    nameAr: 'الأعياد والمناسبات',
    icon: '🎉',
    color: '#EF4444',
    type: 'expense',
  },
  { name: 'Other Expense', nameAr: 'مصروف آخر', icon: '📦', color: '#6B7280', type: 'expense' },
  // Income
  { name: 'Salary', nameAr: 'الراتب', icon: '💰', color: '#10B981', type: 'income' },
  { name: 'Trade', nameAr: 'تجارة وعمل حر', icon: '💼', color: '#3B82F6', type: 'income' },
  { name: 'Other Income', nameAr: 'دخل آخر', icon: '💵', color: '#6B7280', type: 'income' },
];

module.exports = { DEFAULT_CATEGORIES };
