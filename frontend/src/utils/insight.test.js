import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smartInsight } from './insight.js';

const categories = [
  { id: 'g', nameAr: 'بقالة' },
  { id: 'b', nameAr: 'فواتير' },
];
const now = new Date(2026, 10, 10);

test('a budget gone over comes first', () => {
  const result = smartInsight({
    budgets: [
      { categoryId: 'g', amount: 1000, spent: 800 },
      { categoryId: 'b', amount: 500, spent: 620 },
    ],
    categories,
    currency: 'DZD',
    now,
  });
  assert.equal(result.tone, 'alert');
  assert.match(result.text, /فواتير/);
  assert.match(result.text, /120/);
});

test('then the budget closest to its limit', () => {
  const result = smartInsight({
    budgets: [{ categoryId: 'g', amount: 1000, spent: 850 }],
    categories,
    currency: 'DZD',
    now,
  });
  assert.equal(result.tone, 'warn');
  assert.match(result.text, /85%/);
  assert.match(result.text, /150/);
});

test('then a fund that runs out before the month ends', () => {
  const result = smartInsight({
    outlook: { remainingPct: 30, coversMonth: false, runsOutOn: new Date(2026, 10, 20) },
    categories,
    currency: 'DZD',
    now,
  });
  assert.equal(result.tone, 'warn');
  assert.match(result.text, /10 أيام/);
});

test('otherwise where most of the money went, and nothing when there is no spending', () => {
  const result = smartInsight({
    expenseByCategory: [{ categoryId: 'g', total: 3000 }],
    expense: 4000,
    categories,
    currency: 'DZD',
    now,
  });
  assert.equal(result.tone, 'info');
  assert.match(result.text, /بقالة/);
  assert.match(result.text, /75%/);
  assert.equal(smartInsight({ categories, now }), null);
});
