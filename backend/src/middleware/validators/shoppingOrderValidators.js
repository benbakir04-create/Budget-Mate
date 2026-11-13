const { body, param } = require('express-validator');

const createShoppingOrderValidator = [
  body('title').trim().notEmpty().withMessage('TITLE_REQUIRED').isLength({ max: 255 }),
  body('estAmount').isFloat({ min: 0.01 }).withMessage('AMOUNT_MIN_001'),
  body('fundId').isUUID().withMessage('INVALID_FUND_ID'),
];

// The actual price is deducted from the fund, so it must be a positive amount.
const purchaseShoppingOrderValidator = [
  param('id').isUUID().withMessage('INVALID_ORDER_ID'),
  body('actualAmount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0.01 })
    .withMessage('AMOUNT_MIN_001'),
  body('categoryId').isUUID().withMessage('INVALID_CATEGORY_ID'),
  body('description').optional().isLength({ max: 255 }).withMessage('DESCRIPTION_MAX_255'),
];

module.exports = { createShoppingOrderValidator, purchaseShoppingOrderValidator };
