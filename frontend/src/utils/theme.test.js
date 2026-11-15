import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readTheme, isDark } from './theme.js';

const store = value => ({ getItem: () => value });

test('readTheme keeps a known choice and falls back to the phone setting', () => {
  assert.equal(readTheme(store('dark')), 'dark');
  assert.equal(readTheme(store('light')), 'light');
  assert.equal(readTheme(store(null)), 'system');
  assert.equal(readTheme(store('purple')), 'system');
  assert.equal(readTheme(undefined), 'system');
});

test('isDark follows the phone only when the choice is «system»', () => {
  assert.equal(isDark('dark', false), true);
  assert.equal(isDark('light', true), false);
  assert.equal(isDark('system', true), true);
  assert.equal(isDark('system', false), false);
});
