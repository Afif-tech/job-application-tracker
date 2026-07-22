const Joi = require('joi');

const listMembers = {
  params: Joi.object({ listId: Joi.string().uuid().required() }),
};

const invite = {
  params: Joi.object({ listId: Joi.string().uuid().required() }),
  body: Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(191).required(),
  }),
};

const remove = {
  params: Joi.object({
    listId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
  }),
};

module.exports = { listMembers, invite, remove };
