const express = require('express');
const authMiddleware = require('../middleware/auth');
const shoppingOrderController = require('../controllers/shoppingOrderController');
const {
  createShoppingOrderValidator,
  purchaseShoppingOrderValidator,
} = require('../middleware/validators/shoppingOrderValidators');

const router = express.Router();

// Require auth for all routes
router.use(authMiddleware);

// GET /api/orders - Get active shopping orders
router.get('/', shoppingOrderController.getShoppingOrders);

// POST /api/orders - Create a new shopping order request (Owner/Partner)
router.post('/', createShoppingOrderValidator, shoppingOrderController.createShoppingOrder);

// POST /api/orders/:id/approve - Approve shopping order (Owner only)
router.post('/:id/approve', shoppingOrderController.approveShoppingOrder);

// POST /api/orders/:id/purchase - Confirm purchase (Prepaid Joint Fund Debit and transaction conversion)
router.post(
  '/:id/purchase',
  purchaseShoppingOrderValidator,
  shoppingOrderController.purchaseShoppingOrder
);

// DELETE /api/orders/:id - Delete/cancel shopping order
router.delete('/:id', shoppingOrderController.deleteShoppingOrder);

module.exports = router;
