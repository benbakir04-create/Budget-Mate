import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTotals, amountSign, formatAmount, fundOutlook } from './money.js';
import { currencyLabel } from './currency.js';

test('fund deposits (transfers) count toward neither income nor expense', () => {
  const totals = summarizeTotals([
    { type: 'income', amount: '80000' },
    { type: 'transfer', amount: '30000' },
    { type: 'expense', amount: '1200.50', categoryId: 'bills' },
    { type: 'expense', amount: 300, category: { id: 'food' } },
    { type: 'expense', amount: 500, categoryId: 'food' },
  ]);

  assert.deepEqual(totals, {
    income: 80000,
    expense: 2000.5,
    balance: 77999.5,
    count: 4,
    expenseByCategory: [
      { categoryId: 'bills', total: 1200.5 },
      { categoryId: 'food', total: 800 },
    ],
  });
});

test('no transactions gives zero totals', () => {
  assert.deepEqual(summarizeTotals([]), {
    income: 0,
    expense: 0,
    balance: 0,
    count: 0,
    expenseByCategory: [],
  });
});

test('a transfer is shown without a plus or minus sign', () => {
  assert.equal(amountSign('income'), '+');
  assert.equal(amountSign('expense'), '-');
  assert.equal(amountSign('transfer'), '');
});

test('the dinar is the default currency label', () => {
  assert.equal(currencyLabel(undefined), 'د.ج');
  assert.equal(currencyLabel('DZD'), 'د.ج');
  assert.equal(currencyLabel('EUR'), '€');
  assert.equal(currencyLabel('SAR'), 'SAR');
});

test('amounts use Western digits and comma grouping whatever the browser language', () => {
  assert.equal(formatAmount(4350), '4,350');
  assert.equal(formatAmount('60000'), '60,000');
  assert.equal(formatAmount(1200.5), '1,200.5');
  assert.equal(formatAmount(undefined), '0');
});

test('a fund spending fast runs out before the end of the month', () => {
  // 32,400 spent by the 14th is about 2,314 a day: 27,600 lasts 11 more days, to the 25th.
  const outlook = fundOutlook({ balance: 27600, spent: 32400, now: new Date(2026, 10, 14) });
  assert.equal(outlook.total, 60000);
  assert.equal(outlook.remainingPct, 46);
  assert.equal(outlook.coversMonth, false);
  assert.equal(outlook.runsOutOn.getDate(), 25);
  assert.equal(outlook.runsOutOn.getMonth(), 10);
});

test('a fund spending slowly covers the month', () => {
  const outlook = fundOutlook({ balance: 50000, spent: 10000, now: new Date(2026, 10, 14) });
  assert.equal(outlook.remainingPct, 83);
  assert.equal(outlook.coversMonth, true);
  assert.equal(outlook.runsOutOn, null);
});

test('a fund with nothing spent yet covers the month, an empty one does not', () => {
  assert.equal(fundOutlook({ balance: 60000, spent: 0 }).coversMonth, true);
  assert.equal(fundOutlook({ balance: 60000, spent: 0 }).remainingPct, 100);
  const empty = fundOutlook({ balance: 0, spent: 60000 });
  assert.equal(empty.coversMonth, false);
  assert.equal(empty.remainingPct, 0);
});
