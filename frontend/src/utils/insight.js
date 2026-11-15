// One sentence on the home screen that reads the numbers for the family, most urgent first:
// a budget gone over, a budget close to its limit, a fund that won't last the month, then
// where most of the money went. Returns { tone, text } or null when there is nothing to say.
import { budgetStatus, formatAmount } from './money.js';
import { currencyLabel } from './currency.js';
import { formatDate } from './dates.js';

const money = (value, currency) => `${formatAmount(Math.round(value))} ${currencyLabel(currency)}`;

const nameOf = (categoryId, categories) => {
  const category = categories.find(c => c.id === categoryId);
  return category?.nameAr || category?.name || '';
};

export const smartInsight = ({
  budgets = [],
  expenseByCategory = [],
  expense = 0,
  categories = [],
  outlook = null,
  currency,
  now = new Date(),
}) => {
  const tracked = budgets
    .filter(b => Number(b.amount) > 0)
    .map(b => ({ budget: b, ...budgetStatus(b) }))
    .sort((a, b) => b.pct - a.pct);

  const over = tracked.find(b => b.state === 'over');
  if (over) {
    const name = nameOf(over.budget.categoryId, categories) || over.budget.category?.nameAr;
    return {
      tone: 'alert',
      text: `تجاوزتم ميزانية ${name} بـ ${money(over.spent - over.limit, currency)}.`,
    };
  }

  const near = tracked.find(b => b.state === 'near');
  if (near) {
    const name = nameOf(near.budget.categoryId, categories) || near.budget.category?.nameAr;
    return {
      tone: 'warn',
      text: `ميزانية ${name} وصلت ${near.pct}%، بقي منها ${money(near.left, currency)}.`,
    };
  }

  if (outlook && outlook.remainingPct > 0 && !outlook.coversMonth && outlook.runsOutOn) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const days = Math.round((monthEnd - outlook.runsOutOn) / 86400000);
    return {
      tone: 'warn',
      text: `بهذا المعدّل ينفد الصندوق يوم ${formatDate(outlook.runsOutOn, now)}، قبل آخر الشهر بـ ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : days <= 10 ? 'أيام' : 'يومًا'}.`,
    };
  }

  const top = expenseByCategory[0];
  const total = Number(expense) || 0;
  if (top && total > 0 && top.total > 0) {
    const share = Math.round((top.total / total) * 100);
    const name = nameOf(top.categoryId, categories);
    if (name) {
      return {
        tone: 'info',
        text: `أكثر ما صرفتم عليه هذا الشهر ${name}: ${money(top.total, currency)}، أي ${share}% من المصروف.`,
      };
    }
  }
  return null;
};
