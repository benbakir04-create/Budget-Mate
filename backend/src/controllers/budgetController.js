const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const getBudgets = async (req, res, next) => {
  try {
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;
    const whereClause = { userId: ownerId };

    if (req.user.role === 'partner') {
      whereClause.category = { isPrivate: false };
    }

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            icon: true,
            color: true,
            type: true,
            isPrivate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all userIds in the network to calculate total spent (Owner + partners)
    const partners = await prisma.user.findMany({
      where: { parentId: ownerId },
      select: { id: true },
    });
    const partnerIds = partners.map(p => p.id);
    const allUserIds = [ownerId, ...partnerIds];

    // Fetch spent amount for each budget dynamically
    const budgetsWithSpent = await Promise.all(
      budgets.map(async budget => {
        const aggregate = await prisma.transaction.aggregate({
          where: {
            userId: { in: allUserIds },
            categoryId: budget.categoryId,
            type: 'expense',
            date: {
              gte: budget.startDate,
              lte: budget.endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        return {
          ...budget,
          spent: parseFloat(aggregate._sum.amount || 0),
        };
      })
    );

    return res.json({ success: true, data: { budgets: budgetsWithSpent } });
  } catch (err) {
    return next(err);
  }
};

const getBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    const budget = await prisma.budget.findFirst({
      where: { id, userId: ownerId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            icon: true,
            color: true,
            type: true,
            isPrivate: true,
          },
        },
      },
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Budget not found' },
      });
    }

    // 🔒 Enforce partner privacy rules
    if (req.user.role === 'partner' && budget.category.isPrivate) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this budget' },
      });
    }

    // Get all userIds in the network
    const partners = await prisma.user.findMany({
      where: { parentId: ownerId },
      select: { id: true },
    });
    const partnerIds = partners.map(p => p.id);
    const allUserIds = [ownerId, ...partnerIds];

    const aggregate = await prisma.transaction.aggregate({
      where: {
        userId: { in: allUserIds },
        categoryId: budget.categoryId,
        type: 'expense',
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const budgetWithSpent = {
      ...budget,
      spent: parseFloat(aggregate._sum.amount || 0),
    };

    return res.json({ success: true, data: { budget: budgetWithSpent } });
  } catch (err) {
    return next(err);
  }
};

const createBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() },
      });
    }

    // 🔒 Only owner is allowed to create budgets
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can manage budgets' },
      });
    }

    const { amount, period, startDate, endDate, categoryId } = req.body;

    // Verify category belongs to owner
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.userId !== req.user.id) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: 'Category not found or not owned by you' },
      });
    }

    // Check if budget already exists for this category in the same period
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: req.user.id,
        categoryId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    if (existingBudget) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'BUDGET_EXISTS',
          message: 'Budget already exists for this category and period',
        },
      });
    }

    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: req.user.id,
        categoryId,
      },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true, icon: true, color: true, type: true },
        },
      },
    });

    return res.status(201).json({ success: true, data: { budget } });
  } catch (err) {
    return next(err);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() },
      });
    }

    // 🔒 Only owner is allowed to manage budgets
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can manage budgets' },
      });
    }

    const { id } = req.params;
    const { amount, period, startDate, endDate, categoryId } = req.body;

    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Budget not found' },
      });
    }

    // 🔒 Verify ownership check
    if (existing.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to modify this budget' },
      });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (period !== undefined) updateData.period = period;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    if (categoryId !== undefined) {
      // Verify category belongs to owner
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category || category.userId !== req.user.id) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CATEGORY', message: 'Category not found or not owned by you' },
        });
      }
      updateData.categoryId = categoryId;
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, nameAr: true, icon: true, color: true, type: true },
        },
      },
    });

    return res.json({ success: true, data: { budget } });
  } catch (err) {
    return next(err);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    // 🔒 Only owner is allowed to manage budgets
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can manage budgets' },
      });
    }

    const { id } = req.params;

    const existing = await prisma.budget.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Budget not found' },
      });
    }

    // 🔒 Verify ownership check
    if (existing.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this budget' },
      });
    }

    await prisma.budget.delete({
      where: { id },
    });

    return res.json({ success: true, data: { message: 'Budget deleted' } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
};
