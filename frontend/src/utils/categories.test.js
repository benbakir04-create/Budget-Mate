import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manageableCategories, categoryErrorMessage, categoryName } from './categories.js';

const list = [
  { id: 1, nameAr: 'مطاعم', type: 'expense' },
  { id: 2, nameAr: 'راتب', type: 'income' },
  { id: 3, nameAr: 'تمويل الصندوق', type: 'transfer' },
  { id: 4, nameAr: 'بقالة', type: 'expense' },
];

test('lists one type in Arabic order and never the funding category', () => {
  assert.deepEqual(
    manageableCategories(list, 'expense').map(c => c.id),
    [4, 1]
  );
  assert.deepEqual(
    manageableCategories(list, 'income').map(c => c.id),
    [2]
  );
  assert.equal(manageableCategories(list, 'transfer').length, 0);
  assert.deepEqual(manageableCategories(undefined, 'expense'), []);
});

test('does not reorder the list it was given', () => {
  manageableCategories(list, 'expense');
  assert.equal(list[0].id, 1);
});

test('falls back to the English name', () => {
  assert.equal(categoryName({ name: 'Rent' }), 'Rent');
  assert.equal(categoryName(null), '');
});

test('explains a refused delete with the number of transactions', () => {
  assert.match(categoryErrorMessage('CATEGORY_IN_USE', { transactions: 1 }), /عملية واحدة/);
  assert.match(categoryErrorMessage('CATEGORY_IN_USE', { transactions: 2 }), /عمليتين/);
  assert.match(categoryErrorMessage('CATEGORY_IN_USE', { transactions: 7 }), /7 عمليات/);
  assert.match(categoryErrorMessage('CATEGORY_IN_USE', { transactions: 25 }), /25 عملية\./);
  assert.match(categoryErrorMessage('CATEGORY_LOCKED'), /تلقائي/);
  assert.match(categoryErrorMessage('SOMETHING_ELSE'), /حاول مرة أخرى/);
});
