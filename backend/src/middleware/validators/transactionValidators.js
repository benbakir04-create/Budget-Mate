const { body, param, query } = require('express-validator');
const prisma = require('../../config/database');

const amountValidator = body('amount')
  .isFloat({ min: 0.01 })
  .withMessage('AMOUNT_MIN_001');

const typeValidator = body('type')
  .isIn(['income', 'expense'])
  .withMessage('INVALID_TYPE');

const descriptionValidator = body('description')
  .optional()
  .isLength({ max: 255 })
  .withMessage('DESCRIPTION_MAX_255');

const dateValidator = body('date')
  .optional()
  .isISO8601()
  .withMessage('INVALID_DATE');

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

const transactionIdValidator = param('id')
  .isUUID()
  .withMessage('INVALID_TRANSACTION_ID')
  .custom(async (value, { req }) => {
    const transaction = await prisma.transaction.findFirst({
      where: { id: value, userId: req.user.id }
    });
    if (!transaction) {
      throw new Error('TRANSACTION_NOT_FOUND');
    }
    return true;
  });

const createTransactionValidator = [
  amountValidator,
  typeValidator,
  descriptionValidator,
  dateValidator,
  categoryIdValidator
];

const updateTransactionValidator = [
  transactionIdValidator,
  amountValidator.optional(),
  typeValidator.optional(),
  descriptionValidator,
  dateValidator,
  categoryIdValidator.optional()
];

const getTransactionsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('INVALID_PAGE'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('INVALID_LIMIT'),
  query('type').optional().isIn(['income', 'expense']).withMessage('INVALID_TYPE'),
  query('categoryId').optional().isUUID().withMessage('INVALID_CATEGORY_ID'),
  query('startDate').optional().isISO8601().withMessage('INVALID_START_DATE'),
  query('endDate').optional().isISO8601().withMessage('INVALID_END_DATE')
];

module.exports = {
  createTransactionValidator,
  updateTransactionValidator,
  getTransactionsValidator,
  transactionIdValidator
};