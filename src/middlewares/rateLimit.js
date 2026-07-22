const rateLimit = require('express-rate-limit');
const { sendError } = require('../helpers/response');

/**
 * Stricter limiter for auth endpoints to blunt credential-stuffing.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    sendError(res, {
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many attempts, please try again later',
    }),
});

module.exports = { authLimiter };
