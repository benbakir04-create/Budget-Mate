const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const getTransactions = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const {
      page = 1,
      limit = 10,
      type,
      categoryId,
      startDate,
      endDate,
      scope, // 'personal', 'shared'
      fundId
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const take = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * take;

    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;
    
    // Fetch all related user IDs (Owner + all of their partners)
    const partners = await prisma.user.findMany({
      where: { parentId: ownerId },
      select: { id: true }
    });
    const partnerIds = partners.map(p => p.id);
    const allUserIds = [ownerId, ...partnerIds];

    let where = {};

    if (req.user.role === 'owner') {
      // Owner can see everything within their network
      where.userId = { in: allUserIds };
      
      // Filter by scope
      if (scope === 'personal') {
        where.fundId = null;
        where.userId = ownerId; // strictly owner's personal ones
      } else if (scope === 'shared') {
        where.fundId = { not: null };
      }
    } else {
      // 🔒 Partner is in a high-security firewall
      // Partners see only transactions in categories that are NOT private,
      // and only their own logged transactions or shared transactions (where fundId is not null).
      where = {
        userId: { in: allUserIds },
        category: { isPrivate: false },
        OR: [
          { userId: req.user.id },
          { fundId: { not: null } }
        ]
      };
      
      if (scope === 'shared') {
        where.fundId = { not: null };
      }
    }

    // Filter by specific fund
    if (fundId) {
      where.fundId = fundId;
    }

    if (type) where.type = type;
    if (categoryId) {
      // Enforce category visibility
      if (req.user.role === 'partner') {
        const cat = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!cat || cat.isPrivate || cat.userId !== ownerId) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Category not accessible' }
          });
        }
      }
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, nameAr: true, icon: true, color: true, type: true, isPrivate: true }
          },
          user: {
            select: { id: true, name: true, role: true }
          },
          fund: {
            select: { id: true, name: true }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take
      }),
      prisma.transaction.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: take,
          total,
          pages: Math.ceil(total / take)
        }
      }
    });
  } catch (err) {
    return next(err);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;
    
    // Find within the owner's network
    const partners = await prisma.user.findMany({
      where: { parentId: ownerId },
      select: { id: true }
    });
    const partnerIds = partners.map(p => p.id);
    const allUserIds = [ownerId, ...partnerIds];

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: { in: allUserIds } },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true, icon: true, color: true, type: true, isPrivate: true }
        },
        user: {
          select: { id: true, name: true, role: true }
        },
        fund: {
          select: { id: true, name: true }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' }
      });
    }

    // 🔒 Strictly enforce category privacy for partners
    if (req.user.role === 'partner' && transaction.category.isPrivate) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this transaction' }
      });
    }

    return res.json({ success: true, data: { transaction } });
  } catch (err) {
    return next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { amount, type, description, date, categoryId, fundId, receiptUrl } = req.body;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    // 1. Verify Category exists and belongs to Owner
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.userId !== ownerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: 'Category not found or not accessible' }
      });
    }

    // 🔒 Partner cannot log under private categories
    if (req.user.role === 'partner' && category.isPrivate) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot record transactions under a private category' }
      });
    }

    // 2. Prepaid Joint Fund Flow implementation
    let actions = [];
    
    if (fundId) {
      // Verify fund exists and belongs to Owner
      const fund = await prisma.jointFund.findFirst({
        where: { id: fundId, ownerId }
      });
      if (!fund) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_FUND', message: 'Joint fund not found or not accessible' }
        });
      }

      // If it's an expense, decrement the fund balance. If it's income (deposit), increment it!
      const balanceAdjustment = type === 'expense' ? -parseFloat(amount) : parseFloat(amount);
      
      actions.push(
        prisma.jointFund.update({
          where: { id: fundId },
          data: { balance: { increment: balanceAdjustment } }
        })
      );
    }

    // Create the transaction record
    actions.push(
      prisma.transaction.create({
        data: {
          amount: parseFloat(amount),
          type,
          description: description || '',
          date: date ? new Date(date) : new Date(),
          userId: req.user.id,
          categoryId,
          fundId: fundId || null,
          receiptUrl: receiptUrl || null
        },
        include: {
          category: {
            select: { id: true, name: true, nameAr: true, icon: true, color: true, type: true }
          },
          fund: {
            select: { id: true, name: true }
          }
        }
      })
    );

    // Execute in Prisma Transaction
    const results = await prisma.$transaction(actions);
    
    // The created transaction is the last element in the transaction array
    const transaction = results[results.length - 1];

    return res.status(201).json({ success: true, data: { transaction } });
  } catch (err) {
    return next(err);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { id } = req.params;
    const { amount, type, description, date, categoryId, fundId, receiptUrl } = req.body;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    // Fetch the existing transaction
    const oldTx = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!oldTx) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' }
      });
    }

    // 🔒 Security Ownership Check
    // Partners can only modify transactions they logged themselves. Owners can modify all.
    if (oldTx.userId !== req.user.id && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to modify this transaction' }
      });
    }

    // Verify Category if it's changing
    if (categoryId && categoryId !== oldTx.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category || category.userId !== ownerId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CATEGORY', message: 'Category not found or not accessible' }
        });
      }
      if (req.user.role === 'partner' && category.isPrivate) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot record transactions under a private category' }
        });
      }
    }

    // Verify Fund if it's changing
    if (fundId && fundId !== oldTx.fundId) {
      const fund = await prisma.jointFund.findFirst({ where: { id: fundId, ownerId } });
      if (!fund) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_FUND', message: 'Joint fund not found or not accessible' }
        });
      }
    }

    // Compile update fields
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (fundId !== undefined) updateData.fundId = fundId || null;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl || null;

    const targetAmount = amount !== undefined ? parseFloat(amount) : parseFloat(oldTx.amount);
    const targetType = type !== undefined ? type : oldTx.type;
    const targetFundId = fundId !== undefined ? (fundId || null) : oldTx.fundId;

    const actions = [];

    // Financial Audit Math: Revert old impact on the old fund, and apply new impact on the new fund
    if (oldTx.fundId) {
      // Revert old impact (e.g. if we spent 100, we add it back. If we received 100, we subtract it)
      const oldReversion = oldTx.type === 'expense' ? parseFloat(oldTx.amount) : -parseFloat(oldTx.amount);
      actions.push(
        prisma.jointFund.update({
          where: { id: oldTx.fundId },
          data: { balance: { increment: oldReversion } }
        })
      );
    }

    if (targetFundId) {
      // Apply new impact (e.g. if we are spending 120, we subtract it. If we receive 120, we add it)
      const newAdjustment = targetType === 'expense' ? -targetAmount : targetAmount;
      actions.push(
        prisma.jointFund.update({
          where: { id: targetFundId },
          data: { balance: { increment: newAdjustment } }
        })
      );
    }

    // Record the update
    actions.push(
      prisma.transaction.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: { id: true, name: true, nameAr: true, icon: true, color: true, type: true }
          },
          fund: {
            select: { id: true, name: true }
          }
        }
      })
    );

    // Execute in transaction
    const results = await prisma.$transaction(actions);
    const transaction = results[results.length - 1];

    return res.json({ success: true, data: { transaction } });
  } catch (err) {
    return next(err);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' }
      });
    }

    // 🔒 Security Ownership Check
    if (transaction.userId !== req.user.id && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this transaction' }
      });
    }

    const actions = [];

    // Revert fund balance before deleting transaction record
    if (transaction.fundId) {
      const reversion = transaction.type === 'expense' ? parseFloat(transaction.amount) : -parseFloat(transaction.amount);
      actions.push(
        prisma.jointFund.update({
          where: { id: transaction.fundId },
          data: { balance: { increment: reversion } }
        })
      );
    }

    // Delete transaction
    actions.push(
      prisma.transaction.delete({
        where: { id }
      })
    );

    await prisma.$transaction(actions);

    return res.json({ success: true, data: { message: 'Transaction deleted' } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction
};