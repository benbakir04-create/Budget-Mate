const express = require('express');
const authMiddleware = require('../middleware/auth');
const jointFundController = require('../controllers/jointFundController');

const router = express.Router();

// Require auth for all routes
router.use(authMiddleware);

// GET /api/funds - List all joint funds for Owner/Partner
router.get('/', jointFundController.getJointFunds);

// GET /api/funds/:id - Get specific joint fund
router.get('/:id', jointFundController.getJointFund);

// POST /api/funds - Create new joint fund (Owner only)
router.post('/', jointFundController.createJointFund);

// PUT /api/funds/:id - Update joint fund name (Owner only, ownership checked)
router.put('/:id', jointFundController.updateJointFund);

// DELETE /api/funds/:id - Delete joint fund (Owner only, ownership checked)
router.delete('/:id', jointFundController.deleteJointFund);

// POST /api/funds/:id/deposit - Deposit/Add money to a joint fund (Owner only, creates transaction audit)
router.post('/:id/deposit', jointFundController.addMoneyToFund);

module.exports = router;
