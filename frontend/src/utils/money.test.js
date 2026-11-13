import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTotals, amountSign } from './money.js';
import { currencyLabel } from './currency.js';

test('fund deposits (transfers) count toward neither income nor expense', () => {
  const totals = summarizeTotals([
    { type: 'income', amount: '80000' },
    { type: 'transfer', amount: '30000' },
    { type: 'expense', amount: '1200.50' },
    { type: 'expense', amount: 300 },
  ]);

  assert.deepEqual(totals, { income: 80000, expense: 1500.5, balance: 78499.5, count: 3 });
});

test('no transactions gives zero totals', () => {
  assert.deepEqual(summarizeTotals([]), { income: 0, expense: 0, balance: 0, count: 0 });
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
