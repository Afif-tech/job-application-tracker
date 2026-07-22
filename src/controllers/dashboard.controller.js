const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');

const get = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.build(req.user);
  return sendSuccess(res, { data: dashboard });
});

module.exports = { get };
