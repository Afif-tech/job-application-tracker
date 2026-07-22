const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// GET /api/me  ·  PUT /api/me
router.get('/', authenticate, authController.me);
router.put('/', authenticate, validate(authValidator.updateMe), authController.updateMe);

module.exports = router;
