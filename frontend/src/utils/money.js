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
  for (const transaction of transactions) {
    const amount = parseFloat(transaction.amount) || 0;
    if (transaction.type === 'income') {
      income += amount;
      count += 1;
    } else if (transaction.type === 'expense') {
      expense += amount;
      count += 1;
    }
  }
  return { income, expense, balance: income - expense, count };
};

// Amounts are always written with Western digits and comma grouping (4,350), as in Algeria,
// whatever the browser's language. Decimals only when there are any.
const AMOUNT_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const formatAmount = value => AMOUNT_FORMAT.format(Number(value) || 0);
