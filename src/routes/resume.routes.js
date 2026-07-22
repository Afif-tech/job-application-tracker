const express = require('express');
const resumeController = require('../controllers/resume.controller');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const Joi = require('joi');

const resumeIdParam = {
  params: Joi.object({ resumeId: Joi.string().uuid().required() }),
};

// Top-level resume routes (auth checks happen inside the service, since a
// resume can be either shared or personal and lives across two tables).
const router = express.Router();
router.use(authenticate);

router.delete(
  '/shared-resumes/:resumeId',
  validate(resumeIdParam),
  resumeController.deleteShared
);

router.get(
  '/resumes/:resumeId/download',
  validate(resumeIdParam),
  resumeController.download
);

module.exports = router;
