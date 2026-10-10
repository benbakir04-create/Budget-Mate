const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const getJointFunds = async (req, res, next) => {
  try {
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    const funds = await prisma.jointFund.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: { transactions: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: { funds } });
  } catch (err) {
    return next(err);
  }
};

const getJointFund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    const fund = await prisma.jointFund.findFirst({
      where: { id, ownerId },
      include: {
        transactions: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            category: { select: { id: true, name: true, nameAr: true, icon: true, color: true } },
            user: { select: { id: true, name: true } },
          },
        },
        orders: {
          where: { status: 'pending_approval' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!fund) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Joint fund not found' },
      });
    }

    return res.json({ success: true, data: { fund } });
  } catch (err) {
    return next(err);
  }
};

const createJointFund = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() },
      });
    }

    // 🔒 Only owner can create joint funds
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only accounts with Owner role can create joint funds',
        },
      });
    }

    const { name, initialBalance } = req.body;
    const balance = initialBalance ? parseFloat(initialBalance) : 0.0;

    const fund = await prisma.jointFund.create({
      data: {
        name,
        balance,
        ownerId: req.user.id,
      },
    });

    // If initial balance is greater than 0, record an income transaction for funding auditing!
    if (balance > 0) {
      // Find or create a default "Funding" category for the owner
      let category = await prisma.category.findFirst({
        where: { userId: req.user.id, name: 'Funding' },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Funding',
            nameAr: 'تمويل العهدة',
            icon: 'account-balance-wallet',
            color: '#1D9E75',
            type: 'income',
            userId: req.user.id,
          },
        });
      }

      await prisma.transaction.create({
        data: {
          amount: balance,
          type: 'income',
          description: `التمويل الأولي لصندوق: ${name}`,
          userId: req.user.id,
          categoryId: category.id,
          fundId: fund.id,
        },
      });
    }

    return res.status(201).json({ success: true, data: { fund } });
  } catch (err) {
    return next(err);
  }
};

const updateJointFund = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() },
      });
    }

    // 🔒 Only owner can manage joint funds
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only accounts with Owner role can manage joint funds',
        },
      });
    }

    const { id } = req.params;
    const { name } = req.body;

    const existing = await prisma.jointFund.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Joint fund not found' },
      });
    }

    // Verify ownership
    if (existing.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to modify this joint fund' },
      });
    }

    const fund = await prisma.jointFund.update({
      where: { id },
      data: { name },
    });

    return res.json({ success: true, data: { fund } });
  } catch (err) {
    return next(err);
  }
};

const deleteJointFund = async (req, res, next) => {
  try {
    // 🔒 Only owner can manage joint funds
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only accounts with Owner role can manage joint funds',
        },
      });
    }

    const { id } = req.params;

    const existing = await prisma.jointFund.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Joint fund not found' },
      });
    }

    // Verify ownership
    if (existing.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this joint fund' },
      });
    }

    await prisma.jointFund.delete({ where: { id } });

    return res.json({ success: true, data: { message: 'Joint fund deleted' } });
  } catch (err) {
    return next(err);
  }
};

const addMoneyToFund = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() },
      });
    }

    // 🔒 Only owner can add money to joint funds
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can fund accounts' },
      });
    }

    const { id } = req.params; // fundId
    const { amount, description } = req.body;

    const fund = await prisma.jointFund.findUnique({ where: { id } });
    if (!fund) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Joint fund not found' },
      });
    }

    if (fund.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to fund this account' },
      });
    }

    // Find or create default "Funding" category
    let category = await prisma.category.findFirst({
      where: { userId: req.user.id, name: 'Funding' },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Funding',
          nameAr: 'تمويل العهدة',
          icon: 'account-balance-wallet',
          color: '#1D9E75',
          type: 'income',
          userId: req.user.id,
        },
      });
    }

    // Execute balance increment and transaction creation in a transaction block
    const results = await prisma.$transaction([
      prisma.jointFund.update({
        where: { id },
        data: { balance: { increment: parseFloat(amount) } },
      }),
      prisma.transaction.create({
        data: {
          amount: parseFloat(amount),
          type: 'income',
          description: description || 'ضخ تمويل إضافي للصندوق المشترك',
          userId: req.user.id,
          categoryId: category.id,
          fundId: id,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        fund: results[0],
        transaction: results[1],
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getJointFunds,
  getJointFund,
  createJointFund,
  updateJointFund,
  deleteJointFund,
  addMoneyToFund,
};
