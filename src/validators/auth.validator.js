const Joi = require('joi');

const register = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(191).required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required(),
  }),
};

const refresh = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object({
    refreshToken: Joi.string().allow('', null),
  }),
};

const updateMe = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120),
  }).min(1),
};

module.exports = { register, login, refresh, logout, updateMe };
