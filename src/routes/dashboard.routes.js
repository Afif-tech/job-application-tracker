const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', controller.get);

module.exports = router;
