const authService = require('../services/auth.service');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');

function requestContext(req) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };
}

const register = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.register(req.body, requestContext(req));
  return sendSuccess(res, {
    status: 201,
    message: 'Account created',
    data: { user: user.toPublicJSON(), ...tokens },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body, requestContext(req));
  return sendSuccess(res, {
    message: 'Logged in',
    data: { user: user.toPublicJSON(), ...tokens },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.refresh(req.body.refreshToken, requestContext(req));
  return sendSuccess(res, {
    message: 'Token refreshed',
    data: { user: user.toPublicJSON(), ...tokens },
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  return sendSuccess(res, { message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: { user: req.user.toPublicJSON() } });
});

const updateMe = asyncHandler(async (req, res) => {
  if (req.body.name) req.user.name = req.body.name;
  await req.user.save();
  return sendSuccess(res, { message: 'Profile updated', data: { user: req.user.toPublicJSON() } });
});

module.exports = { register, login, refresh, logout, me, updateMe };
