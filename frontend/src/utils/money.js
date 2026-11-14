// A transfer is money moving into a fund (the owner's deposit). It is neither income nor
// spending, so it never counts toward the totals.
export const isTransfer = transaction => transaction.type === 'transfer';

export const amountSign = type => {
  if (type === 'income') return '+';
  if (type === 'expense') return '-';
  return '';
};

export const typeLabel = type => {
  if (type === 'income') return 'دخل';
  if (type === 'expense') return 'مصروف';
  return 'تحويل للصندوق';
};

// Same totals the server's /transactions/summary returns, for demo mode.
export const summarizeTotals = transactions => {
  let income = 0;
  let expense = 0;
  let count = 0;
  const perCategory = new Map();
  for (const transaction of transactions) {
    const amount = parseFloat(transaction.amount) || 0;
    if (transaction.type === 'income') {
      income += amount;
      count += 1;
    } else if (transaction.type === 'expense') {
      expense += amount;
      count += 1;
      const categoryId = transaction.categoryId ?? transaction.category?.id ?? null;
      perCategory.set(categoryId, (perCategory.get(categoryId) || 0) + amount);
    }
  }
  const expenseByCategory = [...perCategory]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
  return { income, expense, balance: income - expense, count, expenseByCategory };
};

// How long a fund lasts at this month's pace. balance is what is left now, spent is what
// went out of it since the 1st. Returns the share left of what the month started with
// (plus top-ups), and either coversMonth or the day the money runs out.
export const fundOutlook = ({ balance, spent, now = new Date() }) => {
  const left = Math.max(Number(balance) || 0, 0);
  const out = Math.max(Number(spent) || 0, 0);
  const total = left + out;
  const remainingPct = total > 0 ? Math.round((left / total) * 100) : 0;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (left <= 0) return { total, remainingPct: 0, coversMonth: false, runsOutOn: now };
  if (out <= 0) return { total, remainingPct, coversMonth: true, runsOutOn: null };

  const perDay = out / Math.max(now.getDate(), 1);
  const daysLeft = Math.floor(left / perDay);
  const runsOutOn = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysLeft);
  if (runsOutOn >= monthEnd) return { total, remainingPct, coversMonth: true, runsOutOn: null };
  return { total, remainingPct, coversMonth: false, runsOutOn };
};

// Where a budget stands: what is left of it and its state. ok under 75%, near from 75%,
// over at 100% or more, the same thresholds as the badges on the home screen.
export const budgetStatus = budget => {
  const limit = Math.max(Number(budget?.amount) || 0, 0);
  const spent = Math.max(Number(budget?.spent) || 0, 0);
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  let state = 'ok';
  if (limit > 0 && pct >= 100) state = 'over';
  else if (pct >= 75) state = 'near';
  return { limit, spent, left: limit - spent, pct, state };
};

// Amounts are always written with Western digits and comma grouping (4,350), as in Algeria,
// whatever the browser's language. Decimals only when there are any.
const AMOUNT_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const formatAmount = value => AMOUNT_FORMAT.format(Number(value) || 0);
