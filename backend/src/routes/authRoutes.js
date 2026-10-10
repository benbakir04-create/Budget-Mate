const express = require('express');
const { registerValidator, loginValidator } = require('../middleware/validators/authValidators');
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerValidator, authController.register);
router.post('/register-partner', authMiddleware, registerValidator, authController.registerPartner);
router.post('/login', loginValidator, authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;


