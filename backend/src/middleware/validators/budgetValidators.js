const { body, param } = require('express-validator');
const prisma = require('../../config/database');

const amountValidator = body('amount')
  .isFloat({ min: 0.01 })
  .withMessage('AMOUNT_MIN_001');

const periodValidator = body('period')
  .isIn(['monthly', 'weekly', 'yearly'])
  .withMessage('INVALID_PERIOD');

const startDateValidator = body('startDate')
  .isISO8601()
  .withMessage('INVALID_START_DATE');

const endDateValidator = body('endDate')
  .isISO8601()
  .withMessage('INVALID_END_DATE')
  .custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.startDate)) {
      throw new Error('END_DATE_AFTER_START');
    }
    return true;
  });

const categoryIdValidator = body('categoryId')
  .isUUID()
  .withMessage('INVALID_CATEGORY_ID')
  .custom(async (value, { req }) => {
    const category = await prisma.category.findFirst({
      where: { id: value, userId: req.user.id }
    });
    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }
    return true;
  });

const budgetIdValidator = param('id')
  .isUUID()
  .withMessage('INVALID_BUDGET_ID')
  .custom(async (value, { req }) => {
    const budget = await prisma.budget.findFirst({
      where: { id: value, userId: req.user.id }
    });
    if (!budget) {
      throw new Error('BUDGET_NOT_FOUND');
    }
    return true;
  });

const createBudgetValidator = [
  amountValidator,
  periodValidator,
  startDateValidator,
  endDateValidator,
  categoryIdValidator
];

const updateBudgetValidator = [
  budgetIdValidator,
  amountValidator.optional(),
  periodValidator.optional(),
  startDateValidator.optional(),
  endDateValidator.optional(),
  categoryIdValidator.optional()
];

module.exports = {
  createBudgetValidator,
  updateBudgetValidator,
  budgetIdValidator
};