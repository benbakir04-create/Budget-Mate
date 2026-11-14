import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NAV_TABS, activeSlot, slotCenter } from './nav.js';

test('activeSlot finds the tab of each page, skipping the «+» slot', () => {
  assert.equal(activeSlot('/dashboard'), 0);
  assert.equal(activeSlot('/transactions'), 1);
  assert.equal(activeSlot('/budget'), 3);
  assert.equal(activeSlot('/funds'), 4);
  assert.equal(NAV_TABS[2], null);
});

test('activeSlot matches sub-pages but not look-alike paths', () => {
  assert.equal(activeSlot('/funds/12'), 4);
  assert.equal(activeSlot('/budgets'), -1);
  assert.equal(activeSlot('/dashboard-old'), -1);
});

test('activeSlot returns -1 for pages outside the bar', () => {
  assert.equal(activeSlot('/settings'), -1);
  assert.equal(activeSlot(''), -1);
  assert.equal(activeSlot(), -1);
});

test('slotCenter places each slot in the middle of its fifth of the bar', () => {
  assert.equal(slotCenter(0), 10);
  assert.equal(slotCenter(2), 50);
  assert.equal(slotCenter(4), 90);
});
