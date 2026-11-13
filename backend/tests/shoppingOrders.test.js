jest.mock('../src/config/database', () => require('./helpers/mockPrisma'));

const prisma = require('../src/config/database');
const {
  approveShoppingOrder,
  purchaseShoppingOrder,
} = require('../src/controllers/shoppingOrderController');
const {
  purchaseShoppingOrderValidator,
} = require('../src/middleware/validators/shoppingOrderValidators');
const { validationResult } = require('express-validator');
const {
  mockRes,
  OWNER,
  PARTNER,
  OTHER_OWNER,
  FUND_ID,
  CATEGORY_ID,
  ORDER_ID,
} = require('./helpers/http');

const next = jest.fn();
const fund = { id: FUND_ID, ownerId: OWNER.id, balance: 20000 };
const order = status => ({
  id: ORDER_ID,
  title: 'قارورة غاز',
  estAmount: 500,
  status,
  fundId: FUND_ID,
  fund,
});
const expenseCategory = { id: CATEGORY_ID, userId: OWNER.id, type: 'expense', isPrivate: false };

const purchase = (user, body = {}) => {
  const res = mockRes();
  return purchaseShoppingOrder(
    { user, params: { id: ORDER_ID }, body: { categoryId: CATEGORY_ID, ...body } },
    res,
    next
  ).then(() => res);
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.category.findUnique.mockResolvedValue(expenseCategory);
  prisma.shoppingOrder.updateMany.mockResolvedValue({ count: 1 });
  prisma.jointFund.update.mockResolvedValue({ ...fund, balance: 19400 });
  prisma.transaction.create.mockImplementation(({ data }) => Promise.resolve(data));
});

describe('buying an order', () => {
  test('a partner buys an approved order: the fund pays the actual price once', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValueOnce(order('approved'));
    prisma.shoppingOrder.findUnique.mockResolvedValueOnce(order('purchased'));

    const res = await purchase(PARTNER, { actualAmount: '600' });

    expect(res.statusCode).toBe(200);
    expect(prisma.shoppingOrder.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID, status: 'approved' },
      data: { status: 'purchased' },
    });
    expect(prisma.jointFund.update).toHaveBeenCalledTimes(1);
    expect(prisma.jointFund.update).toHaveBeenCalledWith({
      where: { id: FUND_ID },
      data: { balance: { decrement: 600 } },
    });
    expect(res.body.data.transaction).toEqual(
      expect.objectContaining({ amount: 600, type: 'expense', fundId: FUND_ID })
    );
  });

  test('without an actual price, the estimated price is charged', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValue(order('approved'));

    await purchase(PARTNER);

    expect(prisma.jointFund.update).toHaveBeenCalledWith({
      where: { id: FUND_ID },
      data: { balance: { decrement: 500 } },
    });
  });

  test('an order already purchased cannot be charged again', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValue(order('purchased'));

    const res = await purchase(OWNER);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('ORDER_ALREADY_PURCHASED');
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
  });

  test('a partner cannot buy an order the owner has not approved', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValue(order('pending_approval'));

    const res = await purchase(PARTNER);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('ORDER_NOT_APPROVED');
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
  });

  test('when two purchase taps race, the second one charges nothing', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValue(order('approved'));
    prisma.shoppingOrder.updateMany.mockResolvedValue({ count: 0 });

    const res = await purchase(PARTNER);

    expect(res.statusCode).toBe(409);
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  test('the purchase must use an expense category', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValue(order('approved'));
    prisma.category.findUnique.mockResolvedValue({ ...expenseCategory, type: 'income' });

    const res = await purchase(PARTNER);

    expect(res.statusCode).toBe(400);
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
  });

  test("another owner's order is out of reach", async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValue(order('approved'));

    const res = await purchase(OTHER_OWNER);

    expect(res.statusCode).toBe(403);
    expect(prisma.jointFund.update).not.toHaveBeenCalled();
  });

  test.each(['0', '-200', 'abc'])('actual price %p is rejected', async actualAmount => {
    const req = { params: { id: ORDER_ID }, body: { categoryId: CATEGORY_ID, actualAmount } };
    for (const chain of purchaseShoppingOrderValidator) await chain.run(req);

    expect(
      validationResult(req)
        .array()
        .map(e => e.param)
    ).toContain('actualAmount');
  });
});

describe('approving an order', () => {
  const approve = user => {
    const res = mockRes();
    return approveShoppingOrder({ user, params: { id: ORDER_ID } }, res, next).then(() => res);
  };

  test('the owner approves a pending order', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValueOnce(order('pending_approval'));
    prisma.shoppingOrder.findUnique.mockResolvedValueOnce(order('approved'));

    const res = await approve(OWNER);

    expect(res.statusCode).toBe(200);
    expect(prisma.shoppingOrder.updateMany).toHaveBeenCalledWith({
      where: { id: ORDER_ID, status: 'pending_approval' },
      data: { status: 'approved' },
    });
    expect(res.body.data.order.status).toBe('approved');
  });

  test('a purchased order cannot be approved again and reopened', async () => {
    prisma.shoppingOrder.findUnique.mockResolvedValue(order('purchased'));
    prisma.shoppingOrder.updateMany.mockResolvedValue({ count: 0 });

    const res = await approve(OWNER);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('ORDER_NOT_PENDING');
  });

  test('a partner cannot approve', async () => {
    const res = await approve(PARTNER);

    expect(res.statusCode).toBe(403);
    expect(prisma.shoppingOrder.updateMany).not.toHaveBeenCalled();
  });
});
