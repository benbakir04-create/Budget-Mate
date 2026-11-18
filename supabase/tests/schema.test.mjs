// Schema and permission checks for وازن. Each check guards one business rule (BR-xx) or
// owner decision (Q-xx) from docs/FUNCTIONAL_INVENTORY.md, and fails without the policy or
// function it covers.
// Usage: npm run test:db  (applies every file in supabase/migrations in order, on PGlite)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [pkgDir, ...migrationPaths] = process.argv.slice(2);
const { PGlite } = await import(
  pathToFileURL(path.join(pkgDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href
);
const db = new PGlite();

// ---- Supabase environment stubs ------------------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb,
    raw_app_meta_data jsonb default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`);

for (const migrationPath of migrationPaths) {
  let sql = readFileSync(migrationPath, 'utf8');
  // gen_random_uuid() is core since PG13; PGlite ships pgcrypto separately.
  sql = sql.replace(/create extension if not exists pgcrypto;/i, '');
  await db.exec(sql);
  console.log('✔ migration applied: ' + path.basename(migrationPath));
}

// ---- helpers ---------------------------------------------------------------------
let pass = 0;
let fail = 0;
const ok = (label, cond, extra) => {
  if (cond) pass++;
  else fail++;
  console.log(
    `${cond ? 'PASS' : 'FAIL'} ${label}${extra !== undefined && !cond ? '  -> ' + JSON.stringify(extra) : ''}`
  );
};
async function as(userId, fn) {
  await db.exec('reset role');
  if (userId === 'anon') {
    await db.exec(`select set_config('request.jwt.claim.sub', '', false); set role anon;`);
  } else {
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId]);
    await db.exec('set role authenticated');
  }
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}
async function q(userId, sql, params = []) {
  return as(userId, async () => {
    try {
      return { ok: true, rows: (await db.query(sql, params)).rows };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
}
const one = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const failedWith = (r, code) => !r.ok && r.error.includes(code);
const balance = async fundId =>
  Number((await one('select balance from public.funds where id = $1', [fundId])).balance);
const signUp = async (email, meta = {}) =>
  (
    await one(
      `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id, raw_app_meta_data`,
      [email, meta]
    )
  ).id;
const cat = async (owner, name) =>
  (await one('select id from public.categories where owner_id = $1 and name = $2', [owner, name]))
    .id;

// ---- fixtures: owner A with partner P, and an unrelated owner B ----------------------
const A = await signUp('a@example.com', { name: 'علي' });
const B = await signUp('b@example.com', { name: 'Other' });
let r;

// ---- BR-32 / BR-10: sign-up ------------------------------------------------------
r = await one('select role, owner_id from public.profiles where id = $1', [A]);
ok(
  'BR-32 a public sign-up becomes an owner of their own network',
  r.role === 'owner' && r.owner_id === A,
  r
);
r = await one(`select raw_app_meta_data ->> 'role' as role from auth.users where id = $1`, [A]);
ok('BR-32 the role is written to app_metadata (it reaches the login token)', r.role === 'owner', r);
const sneaky = await signUp('x@example.com', { role: 'partner', owner_id: A });
r = await one('select role from public.profiles where id = $1', [sneaky]);
ok('BR-32 a role sent in user_metadata is ignored', r.role === 'owner', r);
r = await one('select count(*)::int n from public.categories where owner_id = $1', [A]);
ok('BR-10 a new owner gets the 16 default categories', r.n === 16, r);

// Q-04: the owner invites a partner by email; signing up with it joins A's network.
r = await q(
  B,
  `insert into public.partner_invites (owner_id, email) values ($1, 'p@example.com')`,
  [A]
);
ok("BR-08 an owner cannot invite partners into another owner's network", !r.ok, r);
r = await q(
  A,
  `insert into public.partner_invites (owner_id, email) values ($1, 'p@example.com')`,
  [A]
);
ok('BR-08 / Q-04 the owner invites a partner by email', r.ok, r);
const P = await signUp('P@Example.com', { name: 'Partner' });
r = await one('select role, owner_id from public.profiles where id = $1', [P]);
ok(
  'Q-04 signing up with the invited email makes a partner of that owner',
  r.role === 'partner' && r.owner_id === A,
  r
);
r = await one('select count(*)::int n from public.categories where owner_id = $1', [P]);
ok('BR-10 a partner gets no categories of their own', r.n === 0, r);
r = await one(`select count(*)::int n from public.partner_invites where email = 'p@example.com'`);
ok('Q-04 the invite is used up', r.n === 0, r);
r = await q(
  P,
  `insert into public.partner_invites (owner_id, email) values ($1, 'z@example.com')`,
  [A]
);
ok('BR-08 a partner cannot invite', !r.ok, r);

// ---- BR-01: nothing outside one's network -----------------------------------------------
r = await q('anon', 'select * from public.categories');
ok('anon reads nothing', !r.ok || r.rows.length === 0, r);
r = await q(B, 'select * from public.categories where owner_id = $1', [A]);
ok("BR-01 owner B sees none of A's categories", r.ok && r.rows.length === 0, r);
r = await q(B, 'select * from public.profiles where id = $1', [A]);
ok("BR-01 owner B cannot see A's profile", r.ok && r.rows.length === 0, r);
r = await q(P, 'select * from public.profiles');
ok('a partner sees their network profiles (owner + self)', r.ok && r.rows.length === 2, r);
r = await q(P, `update public.profiles set role = 'owner' where id = $1`, [P]);
ok('BR-32 nobody can change their own role', !r.ok, r);

// ---- funds: BR-05, BR-15, BR-16 ----------------------------------------------------
r = await q(P, `select * from public.create_fund('صندوق الشريك', 0)`);
ok('BR-05 a partner cannot create a fund', failedWith(r, 'FORBIDDEN_OWNER_ONLY'), r);
r = await q(A, `select * from public.create_fund('مصروف البيت', 5000)`);
ok(
  'BR-16 the owner creates a fund with an opening balance',
  r.ok && Number(r.rows[0].balance) === 5000,
  r
);
const F = r.ok ? r.rows[0].id : null;
r = await one(`select count(*)::int n, min(type) t from public.transactions where fund_id = $1`, [
  F,
]);
ok('BR-16 the opening balance is recorded as one transfer', r.n === 1 && r.t === 'transfer', r);
r = await q(A, `select * from public.create_fund('فارغ', 0)`);
const Fempty = r.rows?.[0]?.id;
r = await one(`select count(*)::int n from public.transactions where fund_id = $1`, [Fempty]);
ok('BR-16 an empty fund records no transaction', r.n === 0, r);
r = await q(A, `insert into public.funds (owner_id, name, balance) values ($1, 'x', 999999)`, [A]);
ok('funds cannot be inserted directly (balance only via functions)', !r.ok, r);
r = await q(A, `update public.funds set balance = 999999 where id = $1`, [F]);
ok('the balance cannot be edited directly', !r.ok, r);

r = await q(A, `select * from public.deposit_to_fund($1, 1000, 'تمويل')`, [F]);
ok('BR-15 the owner deposit raises the balance', r.ok && (await balance(F)) === 6000, r);
r = await one(
  `select c.type, c.is_system from public.transactions t join public.categories c on c.id = t.category_id
               where t.fund_id = $1 order by t.created_at desc limit 1`,
  [F]
);
ok(
  'BR-15 / BR-11 a deposit is a transfer in the system Funding category',
  r.type === 'transfer' && r.is_system,
  r
);
r = await q(P, `select * from public.deposit_to_fund($1, 1000)`, [F]);
ok(
  'BR-05 a partner cannot deposit',
  failedWith(r, 'FORBIDDEN_OWNER_ONLY') && (await balance(F)) === 6000,
  r
);
r = await q(B, `select * from public.deposit_to_fund($1, 1000)`, [F]);
ok("BR-05 owner B cannot deposit into A's fund", failedWith(r, 'INVALID_FUND'), r);
r = await q(A, `select * from public.deposit_to_fund($1, -5)`, [F]);
ok('a deposit must be positive', failedWith(r, 'INVALID_AMOUNT'), r);
r = await q(P, `update public.funds set name = 'x' where id = $1 returning id`, [F]);
ok('BR-05 a partner cannot rename a fund', !r.ok || r.rows.length === 0, r);

// ---- categories: BR-02, BR-06, BR-11, BR-12, BR-13 -------------------------------------
const groceries = await cat(A, 'Groceries');
const salary = await cat(A, 'Salary');
const funding = await cat(A, 'Funding');
r = await q(
  A,
  `insert into public.categories (owner_id, name, name_ar, type, is_private)
                values ($1, 'Secret', 'خاص', 'expense', true) returning id`,
  [A]
);
const secret = r.rows?.[0]?.id;
ok('BR-06 the owner adds a private category', r.ok && secret, r);
r = await q(P, 'select id from public.categories where id = $1', [secret]);
ok('BR-02 a partner cannot see a private category', r.ok && r.rows.length === 0, r);
r = await q(
  P,
  `insert into public.categories (owner_id, name, name_ar, type) values ($1, 'P', 'P', 'expense')`,
  [A]
);
ok('BR-06 a partner cannot add categories', !r.ok, r);
r = await q(
  A,
  `insert into public.categories (owner_id, name, name_ar, type) values ($1, 'Groceries', 'x', 'expense')`,
  [A]
);
ok('BR-13 a category name is unique per owner', !r.ok, r);
r = await q(
  A,
  `insert into public.categories (owner_id, name, name_ar, type) values ($1, 'T', 'T', 'transfer')`,
  [A]
);
ok('BR-14 nobody creates a transfer category by hand', !r.ok, r);
r = await q(A, 'delete from public.categories where id = $1 returning id', [funding]);
ok('BR-11 the Funding category cannot be deleted', !r.ok || r.rows.length === 0, r);
r = await q(A, `update public.categories set name_ar = 'x' where id = $1 returning id`, [funding]);
ok('BR-11 the Funding category cannot be edited', !r.ok || r.rows.length === 0, r);

// ---- transactions: BR-14, BR-17 to BR-21 -----------------------------------------------
r = await q(P, `select * from public.record_transaction(300, 'expense', $1, $2, 'خضر')`, [
  groceries,
  F,
]);
ok(
  'BR-18 a partner expense from the fund comes off its balance',
  r.ok && (await balance(F)) === 5700,
  r
);
const pTx = r.rows?.[0]?.id;
r = await q(P, `select * from public.record_transaction(100, 'income', $1, $2)`, [salary, F]);
ok(
  'BR-17 income cannot be recorded on a fund',
  failedWith(r, 'FUND_EXPENSE_ONLY') && (await balance(F)) === 5700,
  r
);
r = await q(A, `select * from public.record_transaction(100, 'transfer', $1, $2)`, [funding, F]);
ok('BR-14 a transfer cannot be entered by hand', failedWith(r, 'INVALID_TYPE'), r);
r = await q(A, `select * from public.record_transaction(100, 'expense', $1)`, [salary]);
ok('BR-19 the category type must match the transaction type', failedWith(r, 'INVALID_CATEGORY'), r);
r = await q(P, `select * from public.record_transaction(100, 'expense', $1)`, [secret]);
ok(
  'BR-20 a partner cannot record under a private category',
  failedWith(r, 'FORBIDDEN_PRIVATE_CATEGORY'),
  r
);
const bGroceries = await cat(B, 'Groceries');
r = await q(A, `select * from public.record_transaction(100, 'expense', $1)`, [bGroceries]);
ok("BR-21 another owner's category is refused", failedWith(r, 'INVALID_CATEGORY'), r);
r = await q(B, `select * from public.record_transaction(100, 'expense', $1, $2)`, [bGroceries, F]);
ok("BR-21 another owner's fund is refused", failedWith(r, 'INVALID_FUND'), r);
r = await q(A, `select * from public.record_transaction(0, 'expense', $1)`, [groceries]);
ok('an amount must be positive', failedWith(r, 'INVALID_AMOUNT'), r);
r = await q(
  A,
  `insert into public.transactions (owner_id, user_id, amount, type, category_id)
                values ($1, $1, 5, 'income', $2)`,
  [A, salary]
);
ok('transactions cannot be inserted directly', !r.ok, r);

// Owner personal expense, owner private expense, partner personal expense.
await q(A, `select * from public.record_transaction(2000, 'expense', $1, null, 'شخصي للمالك')`, [
  groceries,
]);
// A private-category expense paid from a fund: the fund rule alone would show it to the partner.
const Fprivate = (await q(A, `select * from public.create_fund('خاص بالمالك', 0)`)).rows[0].id;
await q(A, `select * from public.record_transaction(700, 'expense', $1, $2)`, [secret, Fprivate]);
await q(A, `select * from public.record_transaction(90000, 'income', $1)`, [salary]);
await q(P, `select * from public.record_transaction(150, 'expense', $1, null, 'شخصي للشريك')`, [
  groceries,
]);

// ---- visibility: BR-02, BR-03, BR-04 ----------------------------------------------
r = await q(P, 'select description, amount, fund_id, user_id from public.transactions');
const pSees = r.rows || [];
ok(
  'BR-03 a partner sees fund transactions and their own',
  pSees.some(t => t.description === 'خضر') && pSees.some(t => t.description === 'شخصي للشريك'),
  pSees
);
ok(
  "BR-04 a partner does not see the owner's personal expenses",
  !pSees.some(t => t.description === 'شخصي للمالك'),
  pSees
);
ok(
  "BR-02 a partner does not see the owner's private-category transactions",
  !pSees.some(t => Number(t.amount) === 700),
  pSees
);
r = await q(A, 'select count(*)::int n from public.transactions');
ok('the owner sees every transaction of the network', r.rows?.[0]?.n === 7, r);
r = await q(B, 'select count(*)::int n from public.transactions');
ok("BR-01 owner B sees none of A's transactions", r.rows?.[0]?.n === 0, r);

// ---- Q-05: a fund may go below zero ---------------------------------------------
r = await q(A, `select * from public.record_transaction(10000, 'expense', $1, $2)`, [
  groceries,
  Fempty,
]);
ok('Q-05 a fund may go below zero', r.ok && (await balance(Fempty)) === -10000, r);

// ---- Q-03 and BR-22: only the owner edits or deletes, and the balance follows ------------
r = await q(P, `select * from public.update_transaction($1, 400, $2, $3, 'x', null)`, [
  pTx,
  groceries,
  F,
]);
ok(
  'Q-03 a partner cannot edit even their own transaction',
  failedWith(r, 'FORBIDDEN_OWNER_ONLY'),
  r
);
r = await q(P, `select public.delete_transaction($1)`, [pTx]);
ok(
  'Q-03 a partner cannot delete even their own transaction',
  failedWith(r, 'FORBIDDEN_OWNER_ONLY'),
  r
);
r = await q(A, `select * from public.update_transaction($1, 400, $2, $3, 'خضر', null)`, [
  pTx,
  groceries,
  F,
]);
ok(
  'BR-22 editing an amount re-applies it to the fund (300 → 400)',
  r.ok && (await balance(F)) === 5600,
  r
);
r = await q(A, `select * from public.update_transaction($1, 400, $2, $3, 'خضر', null)`, [
  pTx,
  groceries,
  Fempty,
]);
ok(
  'BR-22 moving to another fund refunds the old and charges the new',
  r.ok && (await balance(F)) === 6000 && (await balance(Fempty)) === -10400,
  r
);
r = await q(A, `select * from public.update_transaction($1, 400, $2, $3, 'خضر', null)`, [
  pTx,
  salary,
  F,
]);
ok('BR-19 an edit keeps the category type', failedWith(r, 'INVALID_CATEGORY'), r);
r = await q(A, 'select public.delete_transaction($1)', [pTx]);
ok('BR-22 deleting refunds the fund', r.ok && (await balance(Fempty)) === -10000, r);
r = await q(A, `update public.transactions set amount = 1 where owner_id = $1 returning id`, [A]);
ok('transactions cannot be edited directly', !r.ok || r.rows.length === 0, r);

// ---- BR-12, Q-06: history stays intact -------------------------------------------
r = await q(A, 'delete from public.categories where id = $1', [groceries]);
ok('BR-12 a used category cannot be deleted', !r.ok, r);
r = await q(
  A,
  `insert into public.categories (owner_id, name, name_ar, type) values ($1, 'Unused', 'غير مستعمل', 'expense') returning id`,
  [A]
);
r = await q(A, 'delete from public.categories where id = $1 returning id', [r.rows[0].id]);
ok('BR-12 an unused category can be deleted', r.ok && r.rows.length === 1, r);
r = await q(A, 'delete from public.funds where id = $1 returning id', [F]);
ok('Q-06 a fund cannot be deleted', !r.ok || r.rows.length === 0, r);
r = await q(A, `update public.funds set archived_at = now() where id = $1 returning id`, [Fempty]);
ok('Q-06 the owner archives a fund', r.ok && r.rows.length === 1, r);
r = await q(A, `select * from public.record_transaction(5, 'expense', $1, $2)`, [
  groceries,
  Fempty,
]);
ok('Q-06 an archived fund takes no new spending', failedWith(r, 'FUND_ARCHIVED'), r);

// ---- orders: BR-09, BR-23 to BR-27 ---------------------------------------------------
const newOrder = async (who, title, est) =>
  q(
    who,
    `insert into public.orders (owner_id, fund_id, title, est_amount, requested_by)
          values ($1, $2, $3, $4, $5) returning id`,
    [A, F, title, est, who]
  );
r = await newOrder(P, 'زيت', 500);
ok('BR-09 a partner raises an order', r.ok, r);
const o1 = r.rows?.[0]?.id;
r = await q(
  P,
  `insert into public.orders (owner_id, fund_id, title, est_amount, requested_by, status)
                values ($1, $2, 'x', 5, $3, 'approved')`,
  [A, F, P]
);
ok('BR-07 nobody raises an order already approved', !r.ok, r);
r = await q(
  B,
  `insert into public.orders (owner_id, fund_id, title, est_amount, requested_by)
                values ($1, $2, 'x', 5, $3)`,
  [A, F, B]
);
ok("BR-01 owner B cannot raise an order on A's fund", !r.ok, r);
r = await q(P, `update public.orders set status = 'approved' where id = $1 returning id`, [o1]);
ok('BR-07 a partner cannot approve by editing the order', !r.ok || r.rows.length === 0, r);
r = await q(P, 'select * from public.approve_order($1)', [o1]);
ok('BR-07 a partner cannot approve', failedWith(r, 'FORBIDDEN_OWNER_ONLY'), r);
r = await q(P, 'select * from public.purchase_order($1, $2)', [o1, groceries]);
ok('BR-23 a partner cannot buy an order not yet approved', failedWith(r, 'ORDER_NOT_APPROVED'), r);
r = await q(A, 'select * from public.approve_order($1)', [o1]);
ok('BR-07 the owner approves a pending order', r.ok && r.rows[0].status === 'approved', r);
r = await q(P, 'select * from public.purchase_order($1, $2)', [o1, secret]);
ok(
  'BR-27 a partner cannot buy under a private category',
  failedWith(r, 'FORBIDDEN_PRIVATE_CATEGORY'),
  r
);
r = await q(P, 'select * from public.purchase_order($1, $2)', [o1, salary]);
ok('BR-27 the purchase category must be an expense', failedWith(r, 'INVALID_CATEGORY'), r);
r = await q(P, 'select * from public.purchase_order($1, $2, 450)', [o1, groceries]);
ok(
  'BR-24 buying charges the actual price once',
  r.ok && r.rows[0].status === 'purchased' && (await balance(F)) === 5550,
  r
);
r = await q(P, 'select * from public.purchase_order($1, $2, 450)', [o1, groceries]);
ok(
  'BR-25 / BR-26 a second purchase charges nothing',
  failedWith(r, 'ORDER_ALREADY_PURCHASED') && (await balance(F)) === 5550,
  r
);
r = await q(A, 'select * from public.approve_order($1)', [o1]);
ok('BR-26 a purchased order cannot be approved again', failedWith(r, 'ORDER_NOT_PENDING'), r);
r = await newOrder(A, 'خبز', 200);
r = await q(A, 'select * from public.purchase_order($1, $2)', [r.rows[0].id, groceries]);
ok(
  'BR-23 / BR-24 the owner buys a pending order directly, at the estimated price',
  r.ok && (await balance(F)) === 5350,
  r
);

// ---- BR-28: summary --------------------------------------------------------------
const range = [`2000-01-01`, `2100-01-01`];
r = await q(A, `select public.transaction_summary($1, $2) s`, range);
const sA = r.rows?.[0]?.s;
ok(
  'BR-28 totals cover income and expense only (deposits excluded)',
  sA && Number(sA.income) === 90000 && Number(sA.expense) === 2000 + 700 + 150 + 10000 + 450 + 200,
  sA
);
r = await q(P, `select public.transaction_summary($1, $2) s`, range);
const sP = r.rows?.[0]?.s;
ok(
  'BR-02 / BR-28 a partner summary never includes private or owner-personal spending',
  sP && Number(sP.income) === 0 && Number(sP.expense) === 150 + 10000 + 450 + 200,
  sP
);

// ---- budgets: BR-06, BR-29 -------------------------------------------------------
r = await q(
  P,
  `insert into public.budgets (owner_id, category_id, amount, start_date, end_date)
                values ($1, $2, 1000, '2000-01-01', '2100-01-01')`,
  [A, groceries]
);
ok('BR-06 a partner cannot add budgets', !r.ok, r);
r = await q(
  A,
  `insert into public.budgets (owner_id, category_id, amount, start_date, end_date)
                values ($1, $2, 20000, '2000-01-01', '2100-01-01'), ($1, $3, 1000, '2000-01-01', '2100-01-01')`,
  [A, groceries, secret]
);
ok('BR-06 the owner adds budgets', r.ok, r);
r = await q(P, 'select * from public.budgets_with_spent()');
ok(
  'BR-02 a partner does not see the budget of a private category',
  r.ok && r.rows.length === 1 && r.rows[0].category_id === groceries,
  r
);
ok(
  "BR-29 spent counts the whole network's expenses in the category",
  r.ok && Number(r.rows[0].spent) === 2000 + 150 + 10000 + 450 + 200,
  r.rows
);

// ---- BR-31: audit log ------------------------------------------------------------
r = await q(A, 'select action, entity from public.audit_log');
const actions = (r.rows || []).map(x => `${x.action}:${x.entity}`);
ok(
  'BR-31 money actions are audited',
  [
    'deposit:fund',
    'create:transaction',
    'update:transaction',
    'delete:transaction',
    'approve:order',
    'purchase:order',
  ].every(a => actions.includes(a)),
  actions
);
r = await q(P, 'select * from public.audit_log');
ok('BR-31 a partner cannot read the audit log', r.ok && r.rows.length === 0, r);
r = await q(A, 'delete from public.audit_log returning id');
ok('BR-31 the audit log cannot be deleted', !r.ok || r.rows.length === 0, r);
r = await q(A, `select public.audit($1, 'fake', 'fund', null, null, null)`, [A]);
ok('BR-31 nobody writes to the audit log by hand', !r.ok, r);

// ---- hardening (Supabase security advisor) ---------------------------------------
for (const fn of ['require_owner()', "fail('X')", "fund_effect('expense', 1)"]) {
  r = await q(A, `select public.${fn}`);
  ok(
    `internal helper ${fn.split('(')[0]} is not callable from the browser`,
    !r.ok && r.error.includes('permission denied'),
    r
  );
}
r = await db.query(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.prokind = 'f'
                       and not coalesce(p.proconfig, '{}') @> array['search_path=""']`);
ok('every public function pins search_path', r.rows.length === 0, r.rows);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
