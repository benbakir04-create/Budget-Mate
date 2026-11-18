// Rows from Supabase (snake_case, numeric as text) to the shapes the pages already use
// with the old server (camelCase, numbers). Pure functions, tested in mappers.test.js.

const num = value => (value === null || value === undefined ? value : Number(value));

export const categoryFromRow = row =>
  row && {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar,
    icon: row.icon,
    color: row.color,
    type: row.type,
    isPrivate: row.is_private,
    isSystem: row.is_system,
  };

// Only the fields present in data, so an edit sends just what changed.
export const categoryToRow = data => {
  const row = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.nameAr !== undefined) row.name_ar = data.nameAr;
  if (data.icon !== undefined) row.icon = data.icon;
  if (data.color !== undefined) row.color = data.color;
  if (data.type !== undefined) row.type = data.type;
  if (data.isPrivate !== undefined) row.is_private = Boolean(data.isPrivate);
  return row;
};

const countOf = embedded => (Array.isArray(embedded) ? Number(embedded[0]?.count ?? 0) : undefined);

export const fundFromRow = row =>
  row && {
    id: row.id,
    name: row.name,
    balance: num(row.balance),
    ownerId: row.owner_id,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    ...(row.transactions_count || row.orders_count
      ? {
          _count: {
            transactions: countOf(row.transactions_count) ?? 0,
            orders: countOf(row.orders_count) ?? 0,
          },
        }
      : {}),
  };

export const userFromRow = row => row && { id: row.id, name: row.name, role: row.role };

export const transactionFromRow = row =>
  row && {
    id: row.id,
    amount: num(row.amount),
    type: row.type,
    description: row.description,
    date: row.date,
    categoryId: row.category_id,
    fundId: row.fund_id,
    userId: row.user_id,
    createdAt: row.created_at,
    category: row.category ? categoryFromRow(row.category) : undefined,
    user: row.user ? userFromRow(row.user) : undefined,
    fund: row.fund ? { id: row.fund.id, name: row.fund.name } : null,
  };

export const orderFromRow = row =>
  row && {
    id: row.id,
    title: row.title,
    estAmount: num(row.est_amount),
    status: row.status,
    fundId: row.fund_id,
    requestedBy: row.requested_by,
    transactionId: row.transaction_id,
    createdAt: row.created_at,
    fund: row.fund
      ? { id: row.fund.id, name: row.fund.name, balance: num(row.fund.balance) }
      : undefined,
  };

// A row of budgets_with_spent(), with its category looked up in categoriesById.
export const budgetFromRow = (row, categoriesById = new Map()) =>
  row && {
    id: row.budget_id ?? row.id,
    categoryId: row.category_id,
    amount: num(row.amount),
    period: row.period,
    startDate: row.start_date,
    endDate: row.end_date,
    spent: num(row.spent ?? 0),
    category: categoriesById.get(row.category_id),
  };

export const budgetToRow = data => {
  const row = {};
  if (data.categoryId !== undefined) row.category_id = data.categoryId;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.period !== undefined) row.period = data.period;
  if (data.startDate !== undefined) row.start_date = String(data.startDate).slice(0, 10);
  if (data.endDate !== undefined) row.end_date = String(data.endDate).slice(0, 10);
  return row;
};

export const summaryFromRpc = summary => {
  const income = Number(summary?.income || 0);
  const expense = Number(summary?.expense || 0);
  return {
    income,
    expense,
    balance: income - expense,
    count: Number(summary?.count || 0),
    expenseByCategory: (summary?.expense_by_category || []).map(item => ({
      categoryId: item.category_id,
      total: Number(item.total),
    })),
  };
};

// The signed-in user as the pages know it, from the profile row and the auth user.
export const userFromProfile = (profile, authUser) =>
  profile && {
    id: profile.id,
    name: profile.name,
    email: authUser?.email,
    role: profile.role,
    parentId: profile.role === 'partner' ? profile.owner_id : null,
    ownerId: profile.owner_id,
    currency: profile.currency,
    language: profile.language,
  };

// The old server took "until" as inclusive; the database function takes it as exclusive.
export const summaryRange = ({ startDate, endDate } = {}) => ({
  p_from: startDate ? new Date(startDate).toISOString() : '1970-01-01T00:00:00Z',
  p_to: endDate ? new Date(new Date(endDate).getTime() + 1).toISOString() : '2999-12-31T00:00:00Z',
});
