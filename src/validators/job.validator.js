const Joi = require('joi');
const { PLATFORMS, APPLICATION_STATUSES } = require('../constants');

const listUuid = Joi.string().uuid().required();

const jobFields = {
  companyName: Joi.string().trim().min(1).max(160),
  jobTitle: Joi.string().trim().min(1).max(200),
  originalUrl: Joi.string().trim().uri().max(2048),
  platform: Joi.string().valid(...PLATFORMS),
  location: Joi.string().trim().max(160).allow('', null),
  salary: Joi.string().trim().max(120).allow('', null),
  notes: Joi.string().trim().max(5000).allow('', null),
  expiryDate: Joi.date().iso().allow(null),
};

const create = {
  params: Joi.object({ listId: listUuid }),
  body: Joi.object({
    companyName: jobFields.companyName.required(),
    jobTitle: jobFields.jobTitle.required(),
    originalUrl: jobFields.originalUrl.required(),
    platform: jobFields.platform.required(),
    location: jobFields.location,
    salary: jobFields.salary,
    notes: jobFields.notes,
    expiryDate: jobFields.expiryDate,
  }),
};

const update = {
  params: Joi.object({ jobId: Joi.string().uuid().required() }),
  body: Joi.object({ ...jobFields }).min(1),
};

const byListId = { params: Joi.object({ listId: listUuid }) };
const byJobId = { params: Joi.object({ jobId: Joi.string().uuid().required() }) };

const listJobs = {
  params: Joi.object({ listId: listUuid }),
  query: Joi.object({
    search: Joi.string().trim().max(160).allow(''),
    platform: Joi.string().valid(...PLATFORMS),
    status: Joi.string().valid(...APPLICATION_STATUSES),
    createdBy: Joi.string().uuid(),
    hasResume: Joi.boolean(),
  }),
};

module.exports = { create, update, byListId, byJobId, listJobs };
