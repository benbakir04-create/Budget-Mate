const { validationResult } = require('express-validator');
const prisma = require('../config/database');

const getShoppingOrders = async (req, res, next) => {
  try {
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;
    const { fundId, status } = req.query;

    const whereClause = {
      fund: { ownerId },
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
          select: { id: true, name: true, balance: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() },
      });
    }

    const { title, estAmount, fundId } = req.body;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    // Verify fund exists and belongs to Owner
    const fund = await prisma.jointFund.findFirst({
      where: { id: fundId, ownerId },
    });

    if (!fund) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FUND', message: 'Joint fund not found or not accessible' },
      });
    }

    const order = await prisma.shoppingOrder.create({
      data: {
        title,
        estAmount: parseFloat(estAmount),
        fundId,
        requestedBy: req.user.id,
      },
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
        error: { code: 'FORBIDDEN', message: 'Only accounts with Owner role can approve orders' },
      });
    }

    const { id } = req.params;

    const order = await prisma.shoppingOrder.findUnique({
      where: { id },
      include: { fund: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shopping order not found' },
      });
    }

    // Verify ownership of the fund
    if (order.fund.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to approve this order' },
      });
    }

    // Only a pending order can be approved. Approving a purchased order would reopen it
    // and let it be bought, and deducted from the fund, a second time.
    const approved = await prisma.shoppingOrder.updateMany({
      where: { id, status: 'pending_approval' },
      data: { status: 'approved' },
    });
    if (approved.count === 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'ORDER_NOT_PENDING', message: 'Only pending orders can be approved' },
      });
    }

    const updatedOrder = await prisma.shoppingOrder.findUnique({ where: { id } });

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
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() },
      });
    }

    const { id } = req.params;
    const { actualAmount, categoryId, receiptUrl, description } = req.body;
    const ownerId = req.user.role === 'partner' ? req.user.parentId : req.user.id;

    // Fetch order
    const order = await prisma.shoppingOrder.findUnique({
      where: { id },
      include: { fund: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shopping order not found' },
      });
    }

    // Verify accessible network
    if (order.fund.ownerId !== ownerId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    if (order.status === 'purchased') {
      return res.status(409).json({
        success: false,
        error: { code: 'ORDER_ALREADY_PURCHASED', message: 'This order was already purchased' },
      });
    }

    // A partner buys only what the owner approved; the owner may buy a pending order directly.
    if (order.status !== 'approved' && req.user.role !== 'owner') {
      return res.status(409).json({
        success: false,
        error: { code: 'ORDER_NOT_APPROVED', message: 'This order is waiting for approval' },
      });
    }

    // Verify Category
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.userId !== ownerId || category.type !== 'expense') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: 'Category not found or not accessible' },
      });
    }

    // Enforce private categories rules
    if (req.user.role === 'partner' && category.isPrivate) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot record transactions under a private category',
        },
      });
    }

    const finalAmount = parseFloat(actualAmount || order.estAmount);

    // Convert order to transaction and deduct from joint fund, all or nothing.
    const result = await prisma.$transaction(async tx => {
      // Claim the order first: if two "purchased" taps race, only one finds the order
      // still in the status we read, so the fund is charged once.
      const claimed = await tx.shoppingOrder.updateMany({
        where: { id, status: order.status },
        data: { status: 'purchased' },
      });
      if (claimed.count === 0) return null;

      const fund = await tx.jointFund.update({
        where: { id: order.fundId },
        data: { balance: { decrement: finalAmount } },
      });
      const transaction = await tx.transaction.create({
        data: {
          amount: finalAmount,
          type: 'expense',
          description: description || `شراء طلب: ${order.title}`,
          userId: req.user.id,
          categoryId,
          fundId: order.fundId,
          receiptUrl: receiptUrl || null,
        },
        include: {
          category: { select: { id: true, name: true, nameAr: true, icon: true, color: true } },
        },
      });
      const purchasedOrder = await tx.shoppingOrder.findUnique({ where: { id } });
      return { order: purchasedOrder, fund, transaction };
    });

    if (!result) {
      return res.status(409).json({
        success: false,
        error: { code: 'ORDER_ALREADY_PURCHASED', message: 'This order was already purchased' },
      });
    }

    return res.json({ success: true, data: result });
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
      include: { fund: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shopping order not found' },
      });
    }

    // Ownership check: Owners can delete any order. Partners can only delete their own requested orders.
    if (
      order.fund.ownerId !== ownerId ||
      (order.requestedBy !== req.user.id && req.user.role !== 'owner')
    ) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this order' },
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
  deleteShoppingOrder,
};
