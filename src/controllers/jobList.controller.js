const jobListService = require('../services/jobList.service');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');

const list = asyncHandler(async (req, res) => {
  const data = await jobListService.listForUser(req.user);
  return sendSuccess(res, { data: { jobLists: data } });
});

const create = asyncHandler(async (req, res) => {
  const jobList = await jobListService.create(req.user, req.body);
  return sendSuccess(res, {
    status: 201,
    message: 'Job list created',
    data: { jobList },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const jobList = await jobListService.getByUuid(req.jobList, req.membership);
  return sendSuccess(res, { data: { jobList } });
});

const update = asyncHandler(async (req, res) => {
  const jobList = await jobListService.update(req.jobList, req.user, req.body);
  return sendSuccess(res, { message: 'Job list updated', data: { jobList } });
});

const remove = asyncHandler(async (req, res) => {
  await jobListService.remove(req.jobList);
  return sendSuccess(res, { message: 'Job list deleted' });
});

module.exports = { list, create, getOne, update, remove };
