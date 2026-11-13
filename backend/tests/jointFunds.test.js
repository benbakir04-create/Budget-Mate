jest.mock('../src/config/database', () => require('./helpers/mockPrisma'));

const prisma = require('../src/config/database');
const { createJointFund, addMoneyToFund } = require('../src/controllers/jointFundController');
const { depositValidator } = require('../src/middleware/validators/jointFundValidators');
const { validationResult } = require('express-validator');
const { mockRes, OWNER, PARTNER, OTHER_OWNER, FUND_ID } = require('./helpers/http');

const FUNDING_CATEGORY_ID = '77777777-7777-4777-8777-777777777777';
const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  prisma.category.findFirst.mockResolvedValue({ id: FUNDING_CATEGORY_ID, type: 'transfer' });
});

describe('deposit into a joint fund', () => {
  test('owner deposit raises the fund balance and is recorded as a transfer, not income', async () => {
    prisma.jointFund.findUnique.mockResolvedValue({ id: FUND_ID, ownerId: OWNER.id });
    prisma.jointFund.update.mockResolvedValue({ id: FUND_ID, balance: 7500 });
    prisma.transaction.create.mockImplementation(({ data }) => Promise.resolve(data));

    const res = mockRes();
    await addMoneyToFund(
      { user: OWNER, params: { id: FUND_ID }, body: { amount: '2500' } },
      res,
      next
    );

    expect(res.statusCode).toBe(200);
    expect(prisma.jointFund.update).toHaveBeenCalledWith({
      where: { id: FUND_ID },
      data: { balance: { increment: 2500 } },
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 2500,
        type: 'transfer',
        fundId: FUND_ID,
        categoryId: FUNDING_CATEGORY_ID,
        userId: OWNER.id,
      }),
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('the Funding category is created as a transfer category on first deposit', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue({ id: FUNDING_CATEGORY_ID });
    prisma.jointFund.findUnique.mockResolvedValue({ id: FUND_ID, ownerId: OWNER.id });
    prisma.jointFund.update.mockResolvedValue({});
    prisma.transaction.create.mockResolvedValue({});

    await addMoneyToFund(
      { user: OWNER, params: { id: FUND_ID }, body: { amount: 100 } },
      mockRes(),
      next
    );

    expect(prisma.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Funding', type: 'transfer', userId: OWNER.id }),
    });
  });

  test('a partner cannot deposit', async () => {
    const res = mockRes();
    await addMoneyToFund(
      { user: PARTNER, params: { id: FUND_ID }, body: { amount: 500 } },
      res,
      next
    );

    expect(res.statusCode).toBe(403);
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  test("an owner cannot deposit into another owner's fund", async () => {
    prisma.jointFund.findUnique.mockResolvedValue({ id: FUND_ID, ownerId: OWNER.id });

    const res = mockRes();
    await addMoneyToFund(
      { user: OTHER_OWNER, params: { id: FUND_ID }, body: { amount: 500 } },
      res,
      next
    );

    expect(res.statusCode).toBe(403);
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
  });

  test.each([['0'], ['-100'], ['abc'], [undefined]])(
    'the deposit validator rejects amount %p',
    async amount => {
      const req = { params: { id: FUND_ID }, body: { amount } };
      for (const rule of depositValidator) await rule.run(req);
      expect(validationResult(req).isEmpty()).toBe(false);
    }
  );

  test('the deposit validator accepts a positive amount', async () => {
    const req = { params: { id: FUND_ID }, body: { amount: '1500.50' } };
    for (const rule of depositValidator) await rule.run(req);
    expect(validationResult(req).isEmpty()).toBe(true);
  });
});

describe('create a joint fund', () => {
  test('an opening balance is recorded as a transfer in the same database transaction', async () => {
    prisma.jointFund.create.mockResolvedValue({ id: FUND_ID, name: 'مصروف البيت' });
    prisma.transaction.create.mockResolvedValue({});

    const res = mockRes();
    await createJointFund(
      { user: OWNER, body: { name: 'مصروف البيت', initialBalance: 30000 } },
      res,
      next
    );

    expect(res.statusCode).toBe(201);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: 30000, type: 'transfer', fundId: FUND_ID }),
    });
  });

  test('no transaction is recorded for an empty fund', async () => {
    prisma.jointFund.create.mockResolvedValue({ id: FUND_ID });

    await createJointFund({ user: OWNER, body: { name: 'رحلة' } }, mockRes(), next);

    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});
