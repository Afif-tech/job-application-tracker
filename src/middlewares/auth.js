const { verifyAccessToken } = require('../helpers/jwt');
const AppError = require('../helpers/AppError');
const asyncHandler = require('../helpers/asyncHandler');
const { User } = require('../models');

/**
 * Authenticates a request via `Authorization: Bearer <accessToken>`.
 * On success attaches the loaded User instance to req.user.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired access token');
  }

  if (payload.type !== 'access') {
    throw AppError.unauthorized('Wrong token type');
  }

  const user = await User.findOne({ where: { uuid: payload.sub } });
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }

  req.user = user;
  next();
});

module.exports = { authenticate };
