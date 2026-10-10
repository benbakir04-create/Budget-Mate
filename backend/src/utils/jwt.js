const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessExpire = process.env.JWT_EXPIRE || '24h';
const refreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

function generateAccessToken(payload) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpire });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpire });
}

function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};


