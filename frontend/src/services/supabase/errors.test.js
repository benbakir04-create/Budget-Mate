import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toApiError, toAuthError, confirmEmailError } from './errors.js';

const codeOf = err => err.response?.data?.error?.code;

test('money-function codes keep their name, or the alias the pages know', () => {
  assert.equal(codeOf(toApiError({ code: 'P0001', message: 'INVALID_AMOUNT' })), 'INVALID_AMOUNT');
  const forbidden = toApiError({ code: 'P0001', message: 'FORBIDDEN_OWNER_ONLY' });
  assert.equal(codeOf(forbidden), 'FORBIDDEN');
  assert.equal(forbidden.response.status, 403);
  assert.equal(codeOf(toApiError({ code: 'P0001', message: 'FUND_ARCHIVED' })), 'INVALID_FUND');
});

test('unique violations name what already exists', () => {
  const dup = name => ({
    code: '23505',
    message: `duplicate key value violates unique constraint "${name}"`,
  });
  assert.equal(codeOf(toApiError(dup('categories_owner_id_name_key'))), 'CATEGORY_EXISTS');
  assert.equal(
    codeOf(toApiError(dup('budgets_owner_id_category_id_start_date_key'))),
    'BUDGET_EXISTS'
  );
  assert.equal(codeOf(toApiError(dup('partner_invites_email_key'))), 'EMAIL_EXISTS');
});

test('a row still in use takes the code the caller gives, with details', () => {
  const err = toApiError(
    { code: '23503', message: 'violates foreign key constraint' },
    { inUse: 'CATEGORY_IN_USE', details: { transactions: 3 } }
  );
  assert.equal(codeOf(err), 'CATEGORY_IN_USE');
  assert.equal(err.response.data.error.details.transactions, 3);
});

test('RLS refusals read as FORBIDDEN', () => {
  assert.equal(
    codeOf(toApiError({ code: '42501', message: 'new row violates row-level security' })),
    'FORBIDDEN'
  );
});

test('a network failure has no response, like axios', () => {
  assert.equal(toApiError({ message: 'TypeError: Failed to fetch' }).response, undefined);
  assert.equal(toAuthError({ message: 'Failed to fetch' }).response, undefined);
});

test('auth errors map to the statuses the login page explains', () => {
  assert.equal(toAuthError({ code: 'invalid_credentials', status: 400 }).response.status, 401);
  assert.equal(toAuthError({ code: 'user_already_exists', status: 422 }).response.status, 409);
  assert.equal(toAuthError({ code: 'over_request_rate_limit', status: 429 }).response.status, 429);
  assert.equal(toAuthError({ code: 'email_not_confirmed' }).confirmEmail, true);
  assert.equal(confirmEmailError().confirmSent, true);
});
