const express = require('express');
const controller = require('../controllers/job.controller');
const resumeController = require('../controllers/resume.controller');
const statusController = require('../controllers/status.controller');
const validator = require('../validators/job.validator');
const statusValidator = require('../validators/status.validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authorizeJob } = require('../middlewares/authorize');
const { sharedUpload, personalUpload } = require('../config/multer');

// Flat routes for a single job: /api/jobs/:jobId
const router = express.Router();
router.use(authenticate);

router.get(
  '/:jobId',
  validate(validator.byJobId),
  authorizeJob(),
  controller.getOne
);

router.put(
  '/:jobId',
  validate(validator.update),
  authorizeJob({ requireManage: true }),
  controller.update
);

router.delete(
  '/:jobId',
  validate(validator.byJobId),
  authorizeJob({ requireManage: true }),
  controller.remove
);

// ── Resumes for a job ────────────────────────────────────────────
// Any member may upload a shared resume or their own personal resume.
// authorizeJob runs first so we never persist a file for an unauthorized user.
router.post(
  '/:jobId/shared-resume',
  validate(validator.byJobId),
  authorizeJob(),
  sharedUpload.single('file'),
  resumeController.uploadShared
);

router.post(
  '/:jobId/my-resume',
  validate(validator.byJobId),
  authorizeJob(),
  personalUpload.single('file'),
  resumeController.uploadMine
);

router.delete(
  '/:jobId/my-resume',
  validate(validator.byJobId),
  authorizeJob(),
  resumeController.deleteMine
);

// ── Per-user application status ──────────────────────────────────
router.get(
  '/:jobId/my-status',
  validate(statusValidator.getMine),
  authorizeJob(),
  statusController.getMine
);

router.put(
  '/:jobId/my-status',
  validate(statusValidator.setMine),
  authorizeJob(),
  statusController.setMine
);

module.exports = router;
