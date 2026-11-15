// Categories carry an emoji icon (the defaults do). Older ones carry a Material icon name,
// which is mapped to an emoji so every category shows the same kind of picture.
const NAMED = {
  'shopping-cart': '🛒',
  restaurant: '🍽️',
  bolt: '⚡',
  car: '🚗',
  'child-care': '🧸',
  movie: '🎬',
  payments: '💵',
  'account-balance-wallet': '👛',
  lock: '🔒',
};

export const categoryEmoji = icon => {
  if (!icon) return '📦';
  if (/^[\x20-\x7E]+$/.test(icon)) return NAMED[icon] || '📦';
  return icon;
};

// A soft tint of the category's own color, for its tile background.
export const categoryTint = (color, alpha = '24') =>
  /^#[0-9a-f]{6}$/i.test(color || '') ? `${color}${alpha}` : undefined;

// Choices offered when the user makes a new category (stored on the category as data).
export const CATEGORY_EMOJIS = ['🛒', '🍽️', '⚡', '🚗', '🧸', '🏠', '💊', '🎓', '👕', '🎁'];
export const CATEGORY_COLORS = [
  '#12A26E',
  '#2F5BEA',
  '#F5B829',
  '#E5484D',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

const CategoryIcon = ({ category, className = 'h-11 w-11 text-xl', tinted = true }) => (
  <span
    className={`inline-grid place-items-center rounded-2xl bg-soft dark:bg-white/5 shrink-0 ${className}`}
    style={tinted ? { backgroundColor: categoryTint(category?.color) } : undefined}
    aria-hidden="true"
  >
    {categoryEmoji(category?.icon)}
  </span>
);

export default CategoryIcon;
