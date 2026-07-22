const express = require('express');
const controller = require('../controllers/jobList.controller');
const jobController = require('../controllers/job.controller');
const validator = require('../validators/jobList.validator');
const jobValidator = require('../validators/job.validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authorizeJobList } = require('../middlewares/authorize');
const { ROLES } = require('../constants');
const memberRoutes = require('./member.routes');

const router = express.Router();

// All job list routes require authentication.
router.use(authenticate);

// Nested member management: /api/job-lists/:listId/members
router.use('/:listId/members', memberRoutes);

// Nested jobs (list & create): /api/job-lists/:listId/jobs
router.get(
  '/:listId/jobs',
  validate(jobValidator.listJobs),
  authorizeJobList(),
  jobController.list
);
router.post(
  '/:listId/jobs',
  validate(jobValidator.create),
  authorizeJobList(), // any member may add a job
  jobController.create
);

router.get('/', controller.list);
router.post('/', validate(validator.create), controller.create);

router.get(
  '/:listId',
  validate(validator.byId),
  authorizeJobList(),
  controller.getOne
);

router.put(
  '/:listId',
  validate(validator.update),
  authorizeJobList({ role: ROLES.OWNER }),
  controller.update
);

router.delete(
  '/:listId',
  validate(validator.byId),
  authorizeJobList({ role: ROLES.OWNER }),
  controller.remove
);

module.exports = router;
