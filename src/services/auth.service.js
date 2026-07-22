const bcrypt = require('bcryptjs');
const ms = require('../helpers/ms');
const { sequelize, User, RefreshToken } = require('../models');
const AppError = require('../helpers/AppError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../helpers/jwt');
const env = require('../config/env');

const BCRYPT_ROUNDS = 10;

/**
 * Issues a fresh access + refresh pair. Persists the refresh token's
 * hash so it can later be verified, rotated, or revoked.
 * Runs inside an optional transaction.
 */
async function issueTokenPair(user, context = {}, transaction) {
  const accessToken = signAccessToken(user);

  const record = await RefreshToken.create(
    {
      user_id: user.id,
      token_hash: 'pending', // replaced below once we know the jti
      expires_at: new Date(Date.now() + ms(env.jwt.refreshExpires)),
      user_agent: context.userAgent || null,
      ip: context.ip || null,
    },
    { transaction }
  );

  const refreshToken = signRefreshToken(user, record.uuid);
  record.token_hash = hashToken(refreshToken);
  await record.save({ transaction });

  return { accessToken, refreshToken };
}

async function register({ name, email, password }, context) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  return sequelize.transaction(async (transaction) => {
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create(
      { name, email, password_hash },
      { transaction }
    );
    const tokens = await issueTokenPair(user, context, transaction);
    return { user, tokens };
  });
}

async function login({ email, password }, context) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const tokens = await issueTokenPair(user, context);
  return { user, tokens };
}

/**
 * Rotates a refresh token: verifies it, revokes the old one, and issues
 * a new pair. If a *revoked* token is presented (reuse / theft), the whole
 * token family for that user is revoked.
 */
async function refresh(rawToken, context) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
  if (payload.type !== 'refresh') {
    throw AppError.unauthorized('Wrong token type');
  }

  const record = await RefreshToken.findOne({ where: { uuid: payload.jti } });
  if (!record || record.token_hash !== hashToken(rawToken)) {
    throw AppError.unauthorized('Refresh token not recognized');
  }

  // Reuse detection: a revoked token being replayed → nuke the family.
  if (record.revoked_at) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: record.user_id, revoked_at: null } }
    );
    throw AppError.unauthorized('Refresh token has been revoked');
  }

  if (record.expires_at <= new Date()) {
    throw AppError.unauthorized('Refresh token has expired');
  }

  const user = await User.findByPk(record.user_id);
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }

  return sequelize.transaction(async (transaction) => {
    const tokens = await issueTokenPair(user, context, transaction);
    // Link old → new and revoke the old one.
    const successor = await RefreshToken.findOne({
      where: { token_hash: hashToken(tokens.refreshToken) },
      transaction,
    });
    record.revoked_at = new Date();
    record.replaced_by = successor ? successor.uuid : null;
    await record.save({ transaction });
    return { user, tokens };
  });
}

async function logout(rawToken) {
  if (!rawToken) return;
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch (err) {
    return; // already invalid — nothing to revoke
  }
  const record = await RefreshToken.findOne({ where: { uuid: payload.jti } });
  if (record && !record.revoked_at) {
    record.revoked_at = new Date();
    await record.save();
  }
}

module.exports = { register, login, refresh, logout };
