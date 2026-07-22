const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const jobListRoutes = require('./jobList.routes');
const jobRoutes = require('./job.routes');
const resumeRoutes = require('./resume.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.get('/health', (req, res) =>
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } })
);

router.use('/auth', authRoutes);
router.use('/me', userRoutes);
router.use('/job-lists', jobListRoutes);
router.use('/jobs', jobRoutes);
router.use('/', resumeRoutes);
router.use('/dashboard', dashboardRoutes);

// Future phases mount here: search & filters...

module.exports = router;
