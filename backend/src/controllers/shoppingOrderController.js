const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const getShoppingOrders = async (req, res, next) => {
  try {
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;
    const { fundId, status } = req.query;

    const whereClause = {
      fund: { ownerId }
    };

    if (fundId) whereClause.fundId = fundId;
    if (status) {
      whereClause.status = status;
    } else {
      // By default, only get pending or approved items, not purchased ones
      whereClause.status = { in: ['pending_approval', 'approved'] };
    }

    const orders = await prisma.shoppingOrder.findMany({
      where: whereClause,
      include: {
        fund: {
          select: { id: true, name: true, balance: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: { orders } });
  } catch (err) {
    return next(err);
  }
};

const createShoppingOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { title, estAmount, fundId } = req.body;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

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

    const order = await prisma.shoppingOrder.create({
      data: {
        title,
        estAmount: parseFloat(estAmount),
        fundId,
        requestedBy: req.user.id
      }
    });

    return res.status(201).json({ success: true, data: { order } });
  } catch (err) {
    return next(err);
  }
};

const approveShoppingOrder = async (req, res, next) => {
  try {
    // 🔒 Only owner is allowed to approve orders
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can approve orders' }
      });
    }

    const { id } = req.params;

    const order = await prisma.shoppingOrder.findUnique({
      where: { id },
      include: { fund: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shopping order not found' }
      });
    }

    // Verify ownership of the fund
    if (order.fund.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to approve this order' }
      });
    }

    const updatedOrder = await prisma.shoppingOrder.update({
      where: { id },
      data: { status: 'approved' }
    });

    return res.json({ success: true, data: { order: updatedOrder } });
  } catch (err) {
    return next(err);
  }
};

const purchaseShoppingOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { id } = req.params;
    const { actualAmount, categoryId, receiptUrl, description } = req.body;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    // Fetch order
    const order = await prisma.shoppingOrder.findUnique({
      where: { id },
      include: { fund: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shopping order not found' }
      });
    }

    // Verify accessible network
    if (order.fund.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    // Verify Category
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.userId !== ownerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: 'Category not found or not accessible' }
      });
    }

    // Enforce private categories rules
    if (req.user.role === 'partner' && category.isPrivate) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot record transactions under a private category' }
      });
    }

    const finalAmount = parseFloat(actualAmount || order.estAmount);

    // Convert order to transaction and deduct from joint fund
    const results = await prisma.$transaction([
      // 1. Update order status to purchased
      prisma.shoppingOrder.update({
        where: { id },
        data: { status: 'purchased' }
      }),
      // 2. Deduct from joint fund
      prisma.jointFund.update({
        where: { id: order.fundId },
        data: { balance: { decrement: finalAmount } }
      }),
      // 3. Create actual Transaction record
      prisma.transaction.create({
        data: {
          amount: finalAmount,
          type: 'expense',
          description: description || `شراء طلب: ${order.title}`,
          userId: req.user.id,
          categoryId,
          fundId: order.fundId,
          receiptUrl: receiptUrl || null
        },
        include: {
          category: { select: { id: true, name: true, nameAr: true, icon: true, color: true } }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        order: results[0],
        fund: results[1],
        transaction: results[2]
      }
    });
  } catch (err) {
    return next(err);
  }
};

const deleteShoppingOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    const order = await prisma.shoppingOrder.findUnique({
      where: { id },
      include: { fund: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shopping order not found' }
      });
    }

    // Ownership check: Owners can delete any order. Partners can only delete their own requested orders.
    if (order.fund.ownerId !== ownerId || (order.requestedBy !== req.user.id && req.user.role !== 'owner')) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this order' }
      });
    }

    await prisma.shoppingOrder.delete({ where: { id } });

    return res.json({ success: true, data: { message: 'Shopping order deleted' } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getShoppingOrders,
  createShoppingOrder,
  approveShoppingOrder,
  purchaseShoppingOrder,
  deleteShoppingOrder
};
