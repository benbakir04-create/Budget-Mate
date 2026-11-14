import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDay, formatDate } from './dates.js';

const now = new Date(2026, 10, 14, 15, 30); // 14 November 2026, afternoon

test('today and yesterday are written as words', () => {
  assert.equal(formatDay(new Date(2026, 10, 14, 8, 0), now), 'اليوم');
  assert.equal(formatDay(new Date(2026, 10, 13, 23, 59), now), 'أمس');
});

test('older days show day and month in Western digits, without the year', () => {
  const text = formatDay(new Date(2026, 10, 12), now);
  assert.match(text, /^12 /);
  assert.ok(text.includes('نوفمبر'), text);
  assert.ok(!text.includes('2026'), text);
});

test('a date from another year shows the year', () => {
  assert.ok(formatDate(new Date(2025, 11, 31), now).includes('2025'));
});

test('an invalid date gives an empty string', () => {
  assert.equal(formatDay('not a date', now), '');
});
