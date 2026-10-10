const express = require('express');
const {
  createTransactionValidator,
  updateTransactionValidator,
  getTransactionsValidator,
  transactionIdValidator
} = require('../middleware/validators/transactionValidators');
const authMiddleware = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/transactions - Get all transactions with pagination and filters
router.get('/', getTransactionsValidator, transactionController.getTransactions);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', transactionIdValidator, transactionController.getTransaction);

// POST /api/transactions - Create new transaction
router.post('/', createTransactionValidator, transactionController.createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransactionValidator, transactionController.updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', transactionIdValidator, transactionController.deleteTransaction);

module.exports = router;