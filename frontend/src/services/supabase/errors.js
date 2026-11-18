// Turns Supabase errors into the shape the pages already read from the old server:
// err.response.status and err.response.data.error.{code, details}. A network failure has
// no response, as with axios, so the pages show their "cannot reach the server" message.

// Codes raised by the money functions (public.fail) that the pages know under another name.
const RPC_ALIASES = {
  FORBIDDEN_OWNER_ONLY: 'FORBIDDEN',
  FORBIDDEN_PRIVATE_CATEGORY: 'FORBIDDEN',
  FORBIDDEN_NOT_YOUR_ORDER: 'FORBIDDEN',
  FUND_ARCHIVED: 'INVALID_FUND',
  AUTHENTICATION_REQUIRED: 'UNAUTHORIZED',
};

// Unique constraints in supabase/migrations, by their default PostgreSQL names.
const UNIQUE_CODES = [
  ['categories_owner_id_name_key', 'CATEGORY_EXISTS'],
  ['budgets_owner_id_category_id_start_date_key', 'BUDGET_EXISTS'],
  ['partner_invites_email_key', 'EMAIL_EXISTS'],
];

const STATUS = { FORBIDDEN: 403, NOT_FOUND: 404, UNAUTHORIZED: 401 };

const isNetworkFailure = error =>
  !error?.code &&
  /failed to fetch|networkerror|load failed|fetch failed/i.test(error?.message || '');

const withResponse = (message, status, code, details) => {
  const err = new Error(message || code);
  err.response = { status, data: { success: false, error: { code, message, details } } };
  return err;
};

// error: what supabase-js returned. fallback: the code to use for anything unrecognised,
// and inUse: the code for a row still referenced elsewhere (for example CATEGORY_IN_USE).
export const toApiError = (error, { inUse = 'IN_USE', details } = {}) => {
  if (isNetworkFailure(error)) return new Error('NETWORK_ERROR');
  const pg = error?.code;
  const text = `${error?.message || ''} ${error?.details || ''}`;

  if (pg === 'P0001') {
    const raised = String(error.message || '').trim();
    const code = RPC_ALIASES[raised] || raised;
    return withResponse(error.message, STATUS[code] || 400, code, { reason: raised, ...details });
  }
  if (pg === '23505') {
    const hit = UNIQUE_CODES.find(([name]) => text.includes(name));
    return withResponse(error.message, 409, hit ? hit[1] : 'ALREADY_EXISTS', details);
  }
  if (pg === '23503') return withResponse(error.message, 409, inUse, details);
  if (pg === '42501') return withResponse(error.message, 403, 'FORBIDDEN', details);
  if (pg === '23514' || pg === '22P02') {
    return withResponse(error.message, 400, 'VALIDATION_ERROR', details);
  }
  return withResponse(error?.message, 500, 'SERVER_ERROR', details);
};

// Supabase Auth errors, mapped to the statuses AuthLayout's authError already explains.
const AUTH_STATUS = {
  invalid_credentials: 401,
  user_already_exists: 409,
  email_exists: 409,
  over_request_rate_limit: 429,
  over_email_send_rate_limit: 429,
  weak_password: 400,
  validation_failed: 400,
  email_address_invalid: 400,
};

export const toAuthError = error => {
  if (isNetworkFailure(error)) return new Error('NETWORK_ERROR');
  const code = error?.code || '';
  if (code === 'email_not_confirmed') {
    const err = new Error('EMAIL_NOT_CONFIRMED');
    err.confirmEmail = true;
    err.response = {
      status: 403,
      data: { success: false, error: { code: 'EMAIL_NOT_CONFIRMED' } },
    };
    return err;
  }
  const status = AUTH_STATUS[code] || error?.status || 500;
  return withResponse(error?.message, status, code || 'AUTH_ERROR');
};

// Signing up succeeded but Supabase waits for the email link before the first login.
export const confirmEmailError = () => {
  const err = new Error('CONFIRM_EMAIL_SENT');
  err.confirmEmail = true;
  err.confirmSent = true;
  return err;
};
