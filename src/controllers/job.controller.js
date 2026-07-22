const jobService = require('../services/job.service');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');

const list = asyncHandler(async (req, res) => {
  const jobs = await jobService.listForList(
    req.jobList,
    req.membership,
    req.user,
    req.query
  );
  return sendSuccess(res, { data: { jobs } });
});

const create = asyncHandler(async (req, res) => {
  const job = await jobService.create(req.jobList, req.user, req.body);
  return sendSuccess(res, { status: 201, message: 'Job added', data: { job } });
});

const getOne = asyncHandler(async (req, res) => {
  const job = await jobService.getOne(req.job, req.membership, req.user, req.canManage);
  return sendSuccess(res, { data: { job } });
});

const update = asyncHandler(async (req, res) => {
  const job = await jobService.update(req.job, req.membership, req.user, req.body);
  return sendSuccess(res, { message: 'Job updated', data: { job } });
});

const remove = asyncHandler(async (req, res) => {
  await jobService.remove(req.job);
  return sendSuccess(res, { message: 'Job deleted' });
});

module.exports = { list, create, getOne, update, remove };
