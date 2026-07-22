const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign a short-lived access token. Payload carries the user's public uuid.
 */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.uuid, type: 'access' },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

/**
 * Sign a long-lived refresh token. `jti` ties the JWT to a DB row so it
 * can be rotated/revoked. Returns both the token and its jti.
 */
function signRefreshToken(user, jti) {
  const token = jwt.sign(
    { sub: user.uuid, type: 'refresh', jti },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires }
  );
  return token;
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/**
 * Hash a token for storage — we never persist raw refresh tokens.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
