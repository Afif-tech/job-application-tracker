const asyncHandler = require('../helpers/asyncHandler');
const AppError = require('../helpers/AppError');
const { ROLES } = require('../constants');
const { JobList, JobListMember, Job, User } = require('../models');

/**
 * True if the user may edit/delete the job: either the list owner or the
 * job's original creator.
 */
function canManageJob(job, membership, user) {
  return membership.role === ROLES.OWNER || job.created_by === user.id;
}

/**
 * Loads the job list identified by a UUID route param and verifies the
 * current user's access. Attaches:
 *   req.jobList     — the JobList instance (with `owner` eager-loaded)
 *   req.membership  — the caller's JobListMember row
 *
 * @param {object} [opts]
 * @param {string} [opts.param='listId']  route param holding the list uuid
 * @param {string} [opts.role]            required role ('owner'); omit for any member
 */
function authorizeJobList({ param = 'listId', role } = {}) {
  return asyncHandler(async (req, res, next) => {
    const uuid = req.params[param];
    const jobList = await JobList.findOne({
      where: { uuid },
      include: [{ model: User, as: 'owner' }],
    });
    if (!jobList) {
      throw AppError.notFound('Job list not found');
    }

    const membership = await JobListMember.findOne({
      where: { job_list_id: jobList.id, user_id: req.user.id },
    });
    // Non-members must not learn the list exists → 404, not 403.
    if (!membership) {
      throw AppError.notFound('Job list not found');
    }

    if (role === ROLES.OWNER && membership.role !== ROLES.OWNER) {
      throw AppError.forbidden('Only the list owner can perform this action');
    }

    req.jobList = jobList;
    req.membership = membership;
    next();
  });
}

/**
 * Loads a job by its UUID route param and verifies the caller is a member
 * of its parent list. Attaches:
 *   req.job         — the Job instance (with `creator` eager-loaded)
 *   req.jobList     — the parent JobList
 *   req.membership  — the caller's membership row
 *   req.canManage   — whether the caller may edit/delete the job
 *
 * @param {object} [opts]
 * @param {string} [opts.param='jobId']  route param holding the job uuid
 * @param {boolean} [opts.requireManage] if true, 403 unless owner or creator
 */
function authorizeJob({ param = 'jobId', requireManage = false } = {}) {
  return asyncHandler(async (req, res, next) => {
    const uuid = req.params[param];
    const job = await Job.findOne({
      where: { uuid },
      include: [{ model: User, as: 'creator' }],
    });
    if (!job) {
      throw AppError.notFound('Job not found');
    }

    const jobList = await JobList.findByPk(job.job_list_id, {
      include: [{ model: User, as: 'owner' }],
    });
    const membership = jobList
      ? await JobListMember.findOne({
          where: { job_list_id: jobList.id, user_id: req.user.id },
        })
      : null;

    // Not a member (or list gone) → hide existence.
    if (!jobList || !membership) {
      throw AppError.notFound('Job not found');
    }

    const canManage = canManageJob(job, membership, req.user);
    if (requireManage && !canManage) {
      throw AppError.forbidden('Only the list owner or the job creator can do this');
    }

    req.job = job;
    req.jobList = jobList;
    req.membership = membership;
    req.canManage = canManage;
    next();
  });
}

module.exports = { authorizeJobList, authorizeJob, canManageJob };
