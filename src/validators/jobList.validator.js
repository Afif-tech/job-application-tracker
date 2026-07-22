const Joi = require('joi');

const uuidParam = Joi.string().uuid().required();

const create = {
  body: Joi.object({
    title: Joi.string().trim().min(2).max(160).required(),
    description: Joi.string().trim().max(2000).allow('', null),
  }),
};

const update = {
  params: Joi.object({ listId: uuidParam }),
  body: Joi.object({
    title: Joi.string().trim().min(2).max(160),
    description: Joi.string().trim().max(2000).allow('', null),
  }).min(1),
};

const byId = {
  params: Joi.object({ listId: uuidParam }),
};

module.exports = { create, update, byId };
