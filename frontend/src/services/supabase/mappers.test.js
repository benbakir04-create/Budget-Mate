import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  categoryFromRow,
  categoryToRow,
  fundFromRow,
  transactionFromRow,
  orderFromRow,
  budgetFromRow,
  budgetToRow,
  summaryFromRpc,
  userFromProfile,
  summaryRange,
} from './mappers.js';

test('categories round-trip between the page and the table', () => {
  const row = {
    id: 'c1',
    name: 'Rent',
    name_ar: 'الكراء',
    icon: '🏠',
    color: '#8B5CF6',
    type: 'expense',
    is_private: true,
    is_system: false,
  };
  assert.deepEqual(categoryFromRow(row), {
    id: 'c1',
    name: 'Rent',
    nameAr: 'الكراء',
    icon: '🏠',
    color: '#8B5CF6',
    type: 'expense',
    isPrivate: true,
    isSystem: false,
  });
  assert.deepEqual(categoryToRow({ nameAr: 'الكراء', isPrivate: 1 }), {
    name_ar: 'الكراء',
    is_private: true,
  });
});

test('amounts arrive as numbers', () => {
  assert.equal(fundFromRow({ id: 'f', balance: '-150.50' }).balance, -150.5);
  const tx = transactionFromRow({
    id: 't',
    amount: '1200.00',
    type: 'expense',
    category: { id: 'c', name_ar: 'السوق' },
    user: { id: 'u', name: 'علي', role: 'owner' },
    fund: null,
  });
  assert.equal(tx.amount, 1200);
  assert.equal(tx.category.nameAr, 'السوق');
  assert.deepEqual(tx.user, { id: 'u', name: 'علي', role: 'owner' });
  assert.equal(tx.fund, null);
  assert.equal(orderFromRow({ id: 'o', est_amount: '500' }).estAmount, 500);
});

test('fund counts come from the embedded aggregates', () => {
  const fund = fundFromRow({
    id: 'f',
    balance: '0',
    transactions_count: [{ count: 4 }],
    orders_count: [{ count: 1 }],
  });
  assert.deepEqual(fund._count, { transactions: 4, orders: 1 });
});

test('budgets carry their category and spent amount', () => {
  const byId = new Map([['c', { id: 'c', nameAr: 'السوق' }]]);
  const budget = budgetFromRow(
    { budget_id: 'b', category_id: 'c', amount: '20000', spent: '2750', start_date: '2026-11-01' },
    byId
  );
  assert.equal(budget.id, 'b');
  assert.equal(budget.spent, 2750);
  assert.equal(budget.category.nameAr, 'السوق');
  assert.deepEqual(budgetToRow({ startDate: '2026-11-01T00:00:00Z', endDate: '2026-11-30' }), {
    start_date: '2026-11-01',
    end_date: '2026-11-30',
  });
});

test('the summary matches what the server used to send', () => {
  assert.deepEqual(
    summaryFromRpc({
      income: '90000',
      expense: '2750',
      count: 3,
      expense_by_category: [{ category_id: 'c', total: '2750' }],
    }),
    {
      income: 90000,
      expense: 2750,
      balance: 87250,
      count: 3,
      expenseByCategory: [{ categoryId: 'c', total: 2750 }],
    }
  );
});

test('a partner keeps parentId; an owner has none', () => {
  const partner = userFromProfile({ id: 'p', role: 'partner', owner_id: 'a' }, { email: 'p@x.dz' });
  assert.equal(partner.parentId, 'a');
  assert.equal(partner.email, 'p@x.dz');
  assert.equal(userFromProfile({ id: 'a', role: 'owner', owner_id: 'a' }).parentId, null);
});

test('the summary range keeps the old inclusive end date', () => {
  const { p_from, p_to } = summaryRange({
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: '2026-11-30T23:59:59.999Z',
  });
  assert.equal(p_from, '2026-11-01T00:00:00.000Z');
  assert.equal(p_to, '2026-12-01T00:00:00.000Z');
  assert.equal(summaryRange().p_from, '1970-01-01T00:00:00Z');
});
