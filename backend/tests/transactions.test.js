jest.mock('../src/config/database', () => require('./helpers/mockPrisma'));

const prisma = require('../src/config/database');
const {
  createTransaction,
  getTransactionSummary,
} = require('../src/controllers/transactionController');
const {
  createTransactionValidator,
} = require('../src/middleware/validators/transactionValidators');
const { validationResult } = require('express-validator');
const { mockRes, OWNER, PARTNER, FUND_ID, CATEGORY_ID } = require('./helpers/http');

const next = jest.fn();
const expenseCategory = { id: CATEGORY_ID, userId: OWNER.id, type: 'expense', isPrivate: false };

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.findMany.mockResolvedValue([{ id: PARTNER.id }]);
});

const runValidators = async (chains, req) => {
  for (const chain of chains) await chain.run(req);
  return validationResult(req)
    .array()
    .map(e => e.param);
};

describe('recording a transaction', () => {
  test('a partner expense paid from the fund is deducted from the fund balance', async () => {
    prisma.category.findUnique.mockResolvedValue(expenseCategory);
    prisma.jointFund.findFirst.mockResolvedValue({ id: FUND_ID, ownerId: OWNER.id });
    prisma.jointFund.update.mockResolvedValue({});
    prisma.transaction.create.mockResolvedValue({ id: 'tx' });

    const res = mockRes();
    await createTransaction(
      {
        user: PARTNER,
        body: { amount: '1200', type: 'expense', categoryId: CATEGORY_ID, fundId: FUND_ID },
      },
      res,
      next
    );

    expect(res.statusCode).toBe(201);
    expect(prisma.jointFund.findFirst).toHaveBeenCalledWith({
      where: { id: FUND_ID, ownerId: OWNER.id },
    });
    expect(prisma.jointFund.update).toHaveBeenCalledWith({
      where: { id: FUND_ID },
      data: { balance: { decrement: 1200 } },
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 1200, type: 'expense', userId: PARTNER.id }),
      })
    );
  });

  test('income cannot be recorded on a fund, so nobody can inflate its balance', async () => {
    const res = mockRes();
    await createTransaction(
      {
        user: PARTNER,
        body: { amount: '50000', type: 'income', categoryId: CATEGORY_ID, fundId: FUND_ID },
      },
      res,
      next
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('FUND_EXPENSE_ONLY');
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  test('a category of the wrong type is refused (e.g. the Funding transfer category)', async () => {
    prisma.category.findUnique.mockResolvedValue({ ...expenseCategory, type: 'transfer' });

    const res = mockRes();
    await createTransaction(
      { user: OWNER, body: { amount: '300', type: 'expense', categoryId: CATEGORY_ID } },
      res,
      next
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CATEGORY');
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  test("a partner cannot record under the owner's private category", async () => {
    prisma.category.findUnique.mockResolvedValue({ ...expenseCategory, isPrivate: true });

    const res = mockRes();
    await createTransaction(
      { user: PARTNER, body: { amount: '300', type: 'expense', categoryId: CATEGORY_ID } },
      res,
      next
    );

    expect(res.statusCode).toBe(403);
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  test('a fund belonging to another owner is refused', async () => {
    prisma.category.findUnique.mockResolvedValue(expenseCategory);
    prisma.jointFund.findFirst.mockResolvedValue(null);

    const res = mockRes();
    await createTransaction(
      {
        user: OWNER,
        body: { amount: '300', type: 'expense', categoryId: CATEGORY_ID, fundId: FUND_ID },
      },
      res,
      next
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FUND');
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
  });
});

describe('transaction validation', () => {
  test("a partner's category is looked up among the owner's categories", async () => {
    prisma.category.findFirst.mockResolvedValue(expenseCategory);

    const failed = await runValidators(createTransactionValidator, {
      user: PARTNER,
      body: { amount: '100', type: 'expense', categoryId: CATEGORY_ID },
    });

    expect(failed).toEqual([]);
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { id: CATEGORY_ID, userId: OWNER.id },
    });
  });

  test('amount, type and category stay required when creating', async () => {
    const failed = await runValidators(createTransactionValidator, { user: OWNER, body: {} });

    expect(failed).toEqual(expect.arrayContaining(['amount', 'type', 'categoryId']));
  });

  test.each(['0', '-50', 'abc'])('amount %p is rejected', async amount => {
    prisma.category.findFirst.mockResolvedValue(expenseCategory);

    const failed = await runValidators(createTransactionValidator, {
      user: OWNER,
      body: { amount, type: 'expense', categoryId: CATEGORY_ID },
    });

    expect(failed).toContain('amount');
  });

  test('a transfer cannot be entered by hand', async () => {
    prisma.category.findFirst.mockResolvedValue(expenseCategory);

    const failed = await runValidators(createTransactionValidator, {
      user: OWNER,
      body: { amount: '100', type: 'transfer', categoryId: CATEGORY_ID },
    });

    expect(failed).toContain('type');
  });
});

describe('income and expense summary', () => {
  test('totals cover income and expense only, so fund deposits are not counted', async () => {
    prisma.transaction.aggregate.mockImplementation(({ where }) =>
      Promise.resolve(
        where.type === 'income'
          ? { _sum: { amount: 80000 }, _count: { _all: 2 } }
          : { _sum: { amount: 35500 }, _count: { _all: 9 } }
      )
    );

    const res = mockRes();
    await getTransactionSummary({ user: OWNER, query: { type: 'transfer' } }, res, next);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.summary).toEqual({
      income: 80000,
      expense: 35500,
      balance: 44500,
      count: 11,
    });
    const typesQueried = prisma.transaction.aggregate.mock.calls.map(([arg]) => arg.where.type);
    expect(typesQueried.sort()).toEqual(['expense', 'income']);
  });

  test('a partner summary never includes private categories', async () => {
    prisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: null }, _count: { _all: 0 } });

    const res = mockRes();
    await getTransactionSummary({ user: PARTNER, query: {} }, res, next);

    expect(res.body.data.summary).toEqual({ income: 0, expense: 0, balance: 0, count: 0 });
    for (const [arg] of prisma.transaction.aggregate.mock.calls) {
      expect(arg.where.category).toEqual({ isPrivate: false });
    }
  });

  test("a partner asking for a private category's summary is refused", async () => {
    prisma.category.findUnique.mockResolvedValue({ ...expenseCategory, isPrivate: true });

    const res = mockRes();
    await getTransactionSummary({ user: PARTNER, query: { categoryId: CATEGORY_ID } }, res, next);

    expect(res.statusCode).toBe(403);
    expect(prisma.transaction.aggregate).not.toHaveBeenCalled();
  });
});
