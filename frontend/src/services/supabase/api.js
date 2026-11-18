// The app's data calls on Supabase (ROADMAP phase 4). Each service in src/services/ hands
// over to these when USE_SUPABASE is on, and keeps its old return shape so pages do not
// change. Permissions live in the database (RLS and the money functions); nothing here
// decides who may do what.
import { supabase } from '../../lib/supabase';
import { toApiError, toAuthError, confirmEmailError } from './errors';
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
} from './mappers';

const CATEGORY_COLUMNS = 'id, name, name_ar, icon, color, type, is_private, is_system';
const TRANSACTION_SELECT = `*, category:categories(${CATEGORY_COLUMNS}),
  user:profiles!transactions_user_id_fkey(id, name, role), fund:funds(id, name)`;
const ORDER_SELECT = '*, fund:funds(id, name, balance)';

// Unwraps a supabase-js result, or throws in the old server's error shape.
const unwrap = ({ data, error }, options) => {
  if (error) throw toApiError(error, options);
  return data;
};

const signedInId = async () => {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw toApiError({ code: 'P0001', message: 'AUTHENTICATION_REQUIRED' });
  return id;
};

// ---------------------------------------------------------------------------- auth

const loadUser = async authUser => {
  const profile = unwrap(
    await supabase.from('profiles').select('*').eq('id', authUser.id).single()
  );
  return userFromProfile(profile, authUser);
};

export const sbAuth = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAuthError(error);
    return { token: null, user: await loadUser(data.user) };
  },

  // Whoever was invited by email (Q-04) becomes that owner's partner; anyone else becomes
  // an owner. The database decides this, not the browser.
  async register(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });
    if (error) throw toAuthError(error);
    if (!data.session) throw confirmEmailError();
    return { token: null, user: await loadUser(data.user) };
  },

  async restoreSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('NO_SESSION');
    return loadUser(data.session.user);
  },

  async getCurrentUser() {
    return this.restoreSession();
  },

  async updateMe(changes) {
    const id = await signedInId();
    const row = {};
    if (changes.name !== undefined) row.name = changes.name;
    if (changes.currency !== undefined) row.currency = changes.currency;
    if (changes.language !== undefined) row.language = changes.language;
    const profile = unwrap(
      await supabase.from('profiles').update(row).eq('id', id).select('*').single()
    );
    const { data } = await supabase.auth.getSession();
    return userFromProfile(profile, data.session?.user);
  },

  async logout() {
    await supabase.auth.signOut();
  },

  // The owner invites a partner by email; the partner then signs up with that email.
  async invitePartner(email) {
    const ownerId = await signedInId();
    unwrap(
      await supabase
        .from('partner_invites')
        .insert({ owner_id: ownerId, email: email.trim().toLowerCase() })
    );
    return { email };
  },
};

// ---------------------------------------------------------------------- categories

export const sbCategories = {
  async getCategories() {
    const rows = unwrap(
      await supabase.from('categories').select(CATEGORY_COLUMNS).order('name_ar')
    );
    return rows.map(categoryFromRow);
  },

  async createCategory(data) {
    const ownerId = await signedInId();
    const row = unwrap(
      await supabase
        .from('categories')
        .insert({ ...categoryToRow(data), owner_id: ownerId })
        .select(CATEGORY_COLUMNS)
        .single()
    );
    return categoryFromRow(row);
  },

  async updateCategory(id, data) {
    const rows = unwrap(
      await supabase
        .from('categories')
        .update(categoryToRow(data))
        .eq('id', id)
        .select(CATEGORY_COLUMNS)
    );
    if (!rows.length) throw await categoryRefusal(id);
    return categoryFromRow(rows[0]);
  },

  async deleteCategory(id) {
    const { data, error } = await supabase.from('categories').delete().eq('id', id).select('id');
    if (error) {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);
      throw toApiError(error, {
        inUse: 'CATEGORY_IN_USE',
        details: { transactions: count ?? undefined },
      });
    }
    if (!data.length) throw await categoryRefusal(id);
  },
};

// RLS hides a refused change instead of failing it, so say why: the funding category is
// locked for everyone, and only the owner manages the others.
const categoryRefusal = async id => {
  const { data } = await supabase.from('categories').select('is_system').eq('id', id).maybeSingle();
  return toApiError({
    code: 'P0001',
    message: data?.is_system ? 'CATEGORY_LOCKED' : 'FORBIDDEN_OWNER_ONLY',
  });
};

// --------------------------------------------------------------------------- funds

export const sbFunds = {
  async getJointFunds() {
    const rows = unwrap(
      await supabase
        .from('funds')
        .select('*, transactions_count:transactions(count), orders_count:orders(count)')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
    );
    return rows.map(fundFromRow);
  },

  async getJointFund(id) {
    const [fund, transactions, orders] = await Promise.all([
      supabase
        .from('funds')
        .select('*, transactions_count:transactions(count), orders_count:orders(count)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .eq('fund_id', id)
        .order('date', { ascending: false })
        .limit(10),
      supabase
        .from('orders')
        .select('*')
        .eq('fund_id', id)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false }),
    ]);
    const row = unwrap(fund);
    if (!row) return null;
    return {
      ...fundFromRow(row),
      transactions: unwrap(transactions).map(transactionFromRow),
      orders: unwrap(orders).map(orderFromRow),
    };
  },

  async createJointFund(data) {
    const row = unwrap(
      await supabase.rpc('create_fund', {
        p_name: data.name,
        p_initial_balance: Number(data.initialBalance || 0),
      })
    );
    return fundFromRow(row);
  },

  async updateJointFund(id, data) {
    const row = unwrap(
      await supabase.from('funds').update({ name: data.name }).eq('id', id).select('*').single()
    );
    return fundFromRow(row);
  },

  // A fund is archived, never deleted (Q-06): its movements stay in the history.
  async deleteJointFund(id) {
    unwrap(
      await supabase
        .from('funds')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
        .single()
    );
  },

  async addMoneyToFund(id, data) {
    const row = unwrap(
      await supabase.rpc('deposit_to_fund', {
        p_fund_id: id,
        p_amount: Number(data.amount),
        p_description: data.description || '',
      })
    );
    return { fund: fundFromRow(row) };
  },
};

// -------------------------------------------------------------------- transactions

const applyFilters = (query, params) => {
  let q = query;
  if (params.type) q = q.eq('type', params.type);
  if (params.categoryId) q = q.eq('category_id', params.categoryId);
  if (params.fundId) q = q.eq('fund_id', params.fundId);
  if (params.startDate) q = q.gte('date', new Date(params.startDate).toISOString());
  if (params.endDate) q = q.lte('date', new Date(params.endDate).toISOString());
  return q;
};

export const sbTransactions = {
  async getTransactions(params = {}) {
    const page = Math.max(parseInt(params.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(params.limit, 10) || 10, 1), 100);
    const from = (page - 1) * limit;
    const { data, error, count } = await applyFilters(
      supabase.from('transactions').select(TRANSACTION_SELECT, { count: 'exact' }),
      params
    )
      .order('date', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw toApiError(error);
    const total = count ?? data.length;
    return {
      transactions: data.map(transactionFromRow),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async getSummary(params = {}) {
    const summary = unwrap(
      await supabase.rpc('transaction_summary', {
        ...summaryRange(params),
        p_fund_id: params.fundId || null,
      })
    );
    return summaryFromRpc(summary);
  },

  async getTransaction(id) {
    const row = unwrap(
      await supabase.from('transactions').select(TRANSACTION_SELECT).eq('id', id).maybeSingle()
    );
    return transactionFromRow(row);
  },

  async createTransaction(data) {
    const row = unwrap(
      await supabase.rpc('record_transaction', {
        p_amount: Number(data.amount),
        p_type: data.type,
        p_category_id: data.categoryId,
        p_fund_id: data.fundId || null,
        p_description: data.description || '',
        p_date: data.date || null,
      })
    );
    return transactionFromRow(row);
  },

  // The database function takes every field, so fill in what the edit leaves out.
  async updateTransaction(id, data) {
    const current = await this.getTransaction(id);
    if (!current) throw toApiError({ code: 'P0001', message: 'NOT_FOUND' });
    const row = unwrap(
      await supabase.rpc('update_transaction', {
        p_id: id,
        p_amount: Number(data.amount ?? current.amount),
        p_category_id: data.categoryId ?? current.categoryId,
        p_fund_id: data.fundId !== undefined ? data.fundId || null : current.fundId,
        p_description: data.description ?? current.description,
        p_date: data.date ?? current.date,
      })
    );
    return transactionFromRow(row);
  },

  async deleteTransaction(id) {
    unwrap(await supabase.rpc('delete_transaction', { p_id: id }));
  },
};

// -------------------------------------------------------------------------- orders

export const sbOrders = {
  async getShoppingOrders(params = {}) {
    let query = supabase.from('orders').select(ORDER_SELECT);
    if (params.fundId) query = query.eq('fund_id', params.fundId);
    query = params.status
      ? query.eq('status', params.status)
      : query.in('status', ['pending_approval', 'approved']);
    const rows = unwrap(await query.order('created_at', { ascending: false }));
    return rows.map(orderFromRow);
  },

  async createShoppingOrder(data) {
    const userId = await signedInId();
    const ownerId = unwrap(await supabase.rpc('my_owner_id'));
    const row = unwrap(
      await supabase
        .from('orders')
        .insert({
          owner_id: ownerId,
          fund_id: data.fundId,
          title: data.title,
          est_amount: Number(data.estAmount),
          requested_by: userId,
        })
        .select(ORDER_SELECT)
        .single()
    );
    return orderFromRow(row);
  },

  async approveShoppingOrder(id) {
    return orderFromRow(unwrap(await supabase.rpc('approve_order', { p_id: id })));
  },

  async purchaseShoppingOrder(id, data = {}) {
    const actual = data.actualAmount;
    const row = unwrap(
      await supabase.rpc('purchase_order', {
        p_id: id,
        p_category_id: data.categoryId,
        p_actual_amount:
          actual === undefined || actual === null || actual === '' ? null : Number(actual),
        p_description: data.description || null,
      })
    );
    return { order: orderFromRow(row) };
  },

  async deleteShoppingOrder(id) {
    unwrap(await supabase.rpc('delete_order', { p_id: id }));
  },
};

// ------------------------------------------------------------------------- budgets

const categoriesById = async () =>
  new Map((await sbCategories.getCategories()).map(c => [c.id, c]));

export const sbBudgets = {
  async getBudgets() {
    const [rows, byId] = await Promise.all([
      supabase.rpc('budgets_with_spent').then(result => unwrap(result)),
      categoriesById(),
    ]);
    return rows.map(row => budgetFromRow(row, byId));
  },

  async getBudget(id) {
    return (await this.getBudgets()).find(b => b.id === id) || null;
  },

  async createBudget(data) {
    const ownerId = await signedInId();
    const row = unwrap(
      await supabase
        .from('budgets')
        .insert({ ...budgetToRow(data), owner_id: ownerId })
        .select('*')
        .single()
    );
    return budgetFromRow(row, await categoriesById());
  },

  async updateBudget(id, data) {
    const row = unwrap(
      await supabase.from('budgets').update(budgetToRow(data)).eq('id', id).select('*').single()
    );
    return budgetFromRow(row, await categoriesById());
  },

  async deleteBudget(id) {
    unwrap(await supabase.from('budgets').delete().eq('id', id));
  },
};
