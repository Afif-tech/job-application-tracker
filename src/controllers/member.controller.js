const memberService = require('../services/member.service');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');

const list = asyncHandler(async (req, res) => {
  const members = await memberService.list(req.jobList);
  return sendSuccess(res, { data: { members } });
});

const invite = asyncHandler(async (req, res) => {
  const member = await memberService.invite(req.jobList, req.user, req.body.email);
  return sendSuccess(res, {
    status: 201,
    message: 'Member added',
    data: { member },
  });
});

const remove = asyncHandler(async (req, res) => {
  await memberService.remove(req.jobList, req.params.userId);
  return sendSuccess(res, { message: 'Member removed' });
});

module.exports = { list, invite, remove };
