jest.mock('../src/config/database', () => require('./helpers/mockPrisma'));

const prisma = require('../src/config/database');
const { deleteCategory } = require('../src/controllers/categoryController');
const { mockRes, OWNER, PARTNER, OTHER_OWNER, CATEGORY_ID } = require('./helpers/http');

const next = jest.fn();
const category = { id: CATEGORY_ID, userId: OWNER.id, type: 'expense' };

beforeEach(() => jest.clearAllMocks());

const remove = async user => {
  const res = mockRes();
  await deleteCategory({ user, params: { id: CATEGORY_ID } }, res, next);
  return res;
};

describe('deleting a category', () => {
  test('an unused category is deleted', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    prisma.transaction.count.mockResolvedValue(0);
    prisma.category.delete.mockResolvedValue(category);

    const res = await remove(OWNER);

    expect(res.statusCode).toBe(200);
    expect(prisma.transaction.count).toHaveBeenCalledWith({ where: { categoryId: CATEGORY_ID } });
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: CATEGORY_ID } });
  });

  test('a category with transactions is kept, so the money history stays intact', async () => {
    prisma.category.findUnique.mockResolvedValue(category);
    prisma.transaction.count.mockResolvedValue(3);

    const res = await remove(OWNER);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_IN_USE');
    expect(res.body.error.details).toEqual({ transactions: 3 });
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  test('the automatic funding category cannot be deleted', async () => {
    prisma.category.findUnique.mockResolvedValue({ ...category, type: 'transfer' });

    const res = await remove(OWNER);

    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_LOCKED');
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  test('a partner cannot delete categories', async () => {
    const res = await remove(PARTNER);

    expect(res.statusCode).toBe(403);
    expect(prisma.category.findUnique).not.toHaveBeenCalled();
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  test("an owner cannot delete another owner's category", async () => {
    prisma.category.findUnique.mockResolvedValue(category);

    const res = await remove(OTHER_OWNER);

    expect(res.statusCode).toBe(403);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });
});
