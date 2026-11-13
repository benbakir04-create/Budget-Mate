const { body, param } = require('express-validator');

const fundIdParam = param('id').isUUID().withMessage('INVALID_FUND_ID');

const createJointFundValidator = [
  body('name').trim().notEmpty().withMessage('NAME_REQUIRED').isLength({ max: 100 }),
  body('initialBalance')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('INITIAL_BALANCE_MIN_0'),
];

// A deposit must add money: zero or negative amounts would silently drain the fund.
const depositValidator = [
  fundIdParam,
  body('amount').isFloat({ min: 0.01 }).withMessage('AMOUNT_MIN_001'),
  body('description').optional().isLength({ max: 255 }).withMessage('DESCRIPTION_MAX_255'),
];

module.exports = { createJointFundValidator, depositValidator };
