const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const prisma = require('../config/database');

const REFRESH_COOKIE = 'bm_refresh_token';
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_MAX_AGE
  });
}

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    setRefreshCookie(res, result.refreshToken);

    return res.status(201).json({
      success: true,
      data: { token: result.accessToken, user: result.user }
    });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    setRefreshCookie(res, result.refreshToken);

    return res.json({
      success: true,
      data: { token: result.accessToken, user: result.user }
    });
  } catch (err) {
    return next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshTokenValue = req.cookies?.[REFRESH_COOKIE];
    if (!refreshTokenValue) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'No refresh token provided' }
      });
    }
    const result = await authService.refresh(refreshTokenValue);
    setRefreshCookie(res, result.refreshToken);

    return res.json({
      success: true,
      data: { token: result.accessToken, user: result.user }
    });
  } catch (err) {
    return next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, currency: true, language: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    return res.json({ success: true, data: { user } });
  } catch (err) {
    return next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.json({ success: true, data: { message: 'Logged out' } });
};

module.exports = { register, login, refreshToken, me, logout };


