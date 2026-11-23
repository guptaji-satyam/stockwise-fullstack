const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT token with user id
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_stockwise_secret_dev', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
