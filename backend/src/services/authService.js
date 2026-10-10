const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { DEFAULT_CATEGORIES } = require('../constants/defaultCategories');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt');

const SALT_ROUNDS = 10;

async function register({ name, email, password, role = 'owner', parentId = null }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('User already exists');
    err.status = 400;
    err.code = 'USER_EXISTS';
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      parentId,
      // Partners use their owner's categories, so only owners get the defaults.
      ...(role === 'owner' && { categories: { create: DEFAULT_CATEGORIES } })
    }
  });

  const tokens = buildTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

async function registerPartner({ name, email, password, parentId }) {
  return register({ name, email, password, role: 'partner', parentId });
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 400;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const err = new Error('Invalid credentials');
    err.status = 400;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const tokens = buildTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

async function refresh(refreshToken) {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    const tokens = buildTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.status = 401;
    error.code = 'INVALID_TOKEN';
    throw error;
  }
}

function buildTokens(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

module.exports = { register, registerPartner, login, refresh, sanitizeUser };


