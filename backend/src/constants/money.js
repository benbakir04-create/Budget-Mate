// Money-related constants shared by controllers and validators.

// 'transfer' moves the owner's own money into a joint fund (a deposit). It is neither
// income nor expense, so reports must leave it out of both totals.
const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];

// Types a user may enter by hand. Transfers are created only by the fund deposit endpoint.
const USER_TRANSACTION_TYPES = ['income', 'expense'];

// The first launch market is Algeria.
const DEFAULT_CURRENCY = 'DZD';
const SUPPORTED_CURRENCIES = ['DZD', 'EUR', 'USD'];

// Category attached to every deposit into a joint fund.
const FUNDING_CATEGORY = {
  name: 'Funding',
  nameAr: 'تمويل الصندوق',
  icon: 'account-balance-wallet',
  color: '#1D9E75',
  type: 'transfer',
};

module.exports = {
  TRANSACTION_TYPES,
  USER_TRANSACTION_TYPES,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  FUNDING_CATEGORY,
};
