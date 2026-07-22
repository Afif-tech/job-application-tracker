const statusService = require('../services/status.service');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');

const getMine = asyncHandler(async (req, res) => {
  const status = await statusService.getMine(req.job, req.user);
  return sendSuccess(res, { data: { status } });
});

const setMine = asyncHandler(async (req, res) => {
  const status = await statusService.setMine(req.job, req.user, req.body.status);
  return sendSuccess(res, { message: 'Status updated', data: { status } });
});

module.exports = { getMine, setMine };
