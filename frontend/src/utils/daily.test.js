import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailySpending } from './daily.js';

test('dailySpending adds up expenses per day and ignores income, transfers and other months', () => {
  const start = new Date(2026, 10, 1);
  const totals = dailySpending(
    [
      { type: 'expense', amount: '300', date: new Date(2026, 10, 3, 9).toISOString() },
      { type: 'expense', amount: 200, date: new Date(2026, 10, 3, 18).toISOString() },
      { type: 'income', amount: 9000, date: new Date(2026, 10, 3).toISOString() },
      { type: 'transfer', amount: 5000, date: new Date(2026, 10, 4).toISOString() },
      { type: 'expense', amount: 80, date: new Date(2026, 9, 31).toISOString() },
      { type: 'expense', amount: 50, date: new Date(2026, 10, 30).toISOString() },
    ],
    start
  );
  assert.equal(totals.length, 30);
  assert.equal(totals[2], 500);
  assert.equal(totals[3], 0);
  assert.equal(totals[29], 50);
  assert.equal(
    totals.reduce((a, b) => a + b, 0),
    550
  );
});
