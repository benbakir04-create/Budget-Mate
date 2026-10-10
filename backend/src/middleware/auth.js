const { verifyAccessToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'No token provided' }
      });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
}

module.exports = authMiddleware;


