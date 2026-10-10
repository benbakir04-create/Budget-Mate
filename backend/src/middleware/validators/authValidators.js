const { body } = require('express-validator');

const emailValidator = body('email').isEmail().withMessage('INVALID_EMAIL');
const passwordValidator = body('password')
  .isLength({ min: 8 })
  .withMessage('PASSWORD_MIN_8');
const nameValidator = body('name').trim().notEmpty().withMessage('NAME_REQUIRED');

const registerValidator = [nameValidator, emailValidator, passwordValidator];
const loginValidator = [emailValidator, passwordValidator];

module.exports = { registerValidator, loginValidator };


