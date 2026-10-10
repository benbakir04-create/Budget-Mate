const express = require('express');
const {
  createBudgetValidator,
  updateBudgetValidator,
  budgetIdValidator
} = require('../middleware/validators/budgetValidators');
const authMiddleware = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/budgets - Get all budgets
router.get('/', budgetController.getBudgets);

// GET /api/budgets/:id - Get single budget
router.get('/:id', budgetIdValidator, budgetController.getBudget);

// POST /api/budgets - Create new budget
router.post('/', createBudgetValidator, budgetController.createBudget);

// PUT /api/budgets/:id - Update budget
router.put('/:id', updateBudgetValidator, budgetController.updateBudget);

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', budgetIdValidator, budgetController.deleteBudget);

module.exports = router;