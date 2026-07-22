const Joi = require('joi');
const { APPLICATION_STATUSES } = require('../constants');

const jobIdParam = Joi.object({ jobId: Joi.string().uuid().required() });

const getMine = { params: jobIdParam };

const setMine = {
  params: jobIdParam,
  body: Joi.object({
    status: Joi.string()
      .valid(...APPLICATION_STATUSES)
      .required(),
  }),
};

module.exports = { getMine, setMine };
