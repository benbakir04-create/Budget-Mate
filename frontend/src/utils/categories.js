// Choices offered when a family adds or edits a category. The color is stored with the
// category (it tints its tile everywhere), so these are data, not page styling.
export const CATEGORY_EMOJIS = [
  '🛒',
  '🍽️',
  '⚡',
  '🚗',
  '🏠',
  '💊',
  '🧸',
  '📚',
  '👕',
  '📱',
  '☕',
  '🎁',
  '✈️',
  '🎬',
  '🔧',
  '🐑',
  '💵',
  '👛',
  '🧾',
  '🔒',
];

export const CATEGORY_COLORS = [
  '#12A26E',
  '#2F5BEA',
  '#06B6D4',
  '#8B5CF6',
  '#EC4899',
  '#E5484D',
  '#F59E0B',
  '#6B7280',
];

export const categoryName = category => category?.nameAr || category?.name || '';

// The categories a family manages for one type, in Arabic alphabetical order. The funding
// category is attached by the server to every deposit, so it never shows up here.
export const manageableCategories = (categories, type) =>
  (categories || [])
    .filter(c => c.type === type && c.type !== 'transfer')
    .sort((a, b) => categoryName(a).localeCompare(categoryName(b), 'ar'));

// A plain sentence for each refusal the server can send back about categories.
export const categoryErrorMessage = (code, details) => {
  switch (code) {
    case 'CATEGORY_IN_USE': {
      const n = details?.transactions;
      // Arabic counting: 3 to 10 take the plural, 11 and up the singular.
      let count = 'عمليات';
      if (n === 1) count = 'عملية واحدة';
      else if (n === 2) count = 'عمليتين';
      else if (n >= 3 && n <= 10) count = `${n} عمليات`;
      else if (n > 10) count = `${n} عملية`;
      return `لا يمكن حذف هذا القسم لأن فيه ${count}. غيّر اسمه بدل حذفه.`;
    }
    case 'CATEGORY_LOCKED':
      return 'قسم «تمويل الصندوق» تلقائي ولا يُحذف.';
    case 'CATEGORY_EXISTS':
      return 'يوجد قسم بهذا الاسم.';
    case 'FORBIDDEN':
      return 'صاحب الحساب وحده يدير الأقسام.';
    default:
      return 'تعذّر الحفظ، حاول مرة أخرى.';
  }
};
