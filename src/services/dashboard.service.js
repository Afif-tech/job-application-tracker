const { Op } = require('sequelize');
const {
  Job,
  JobList,
  JobListMember,
  UserJobStatus,
  User,
} = require('../models');
const { APPLICATION_STATUSES } = require('../constants');

const DEFAULT_STATUS = 'not_applied';
const RECENT_LIMIT = 6;

/**
 * Builds the dashboard aggregate for a user across every list they belong to:
 * counts, per-status breakdown, and the most recently added jobs (each
 * annotated with the user's own status).
 */
async function build(user) {
  const memberships = await JobListMember.findAll({
    where: { user_id: user.id },
    attributes: ['job_list_id'],
  });
  const listIds = memberships.map((m) => m.job_list_id);

  // Zero-state shortcut.
  if (listIds.length === 0) {
    return emptyPayload();
  }

  const jobs = await Job.findAll({
    where: { job_list_id: { [Op.in]: listIds } },
    include: [
      { model: JobList, as: 'jobList', attributes: ['uuid', 'title'] },
      { model: User, as: 'creator', attributes: ['uuid', 'name'] },
    ],
    order: [['created_at', 'DESC']],
  });
  const jobIds = jobs.map((j) => j.id);

  // The user's own status rows for those jobs.
  const statusRows = jobIds.length
    ? await UserJobStatus.findAll({
        where: { user_id: user.id, job_id: { [Op.in]: jobIds } },
      })
    : [];
  const statusByJobId = new Map(statusRows.map((s) => [s.job_id, s.status]));

  // Per-status breakdown (jobs without a row count as not_applied).
  const statusCounts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
  for (const job of jobs) {
    const st = statusByJobId.get(job.id) || DEFAULT_STATUS;
    statusCounts[st] += 1;
  }

  const interviewStages = [
    'interview',
    'assessment',
    'hr_interview',
    'technical_interview',
  ];
  const interviewCount = interviewStages.reduce((sum, s) => sum + statusCounts[s], 0);

  const recentJobs = jobs.slice(0, RECENT_LIMIT).map((job) => ({
    uuid: job.uuid,
    companyName: job.company_name,
    jobTitle: job.job_title,
    platform: job.platform,
    createdAt: job.created_at,
    jobList: job.jobList ? { uuid: job.jobList.uuid, title: job.jobList.title } : null,
    myStatus: statusByJobId.get(job.id) || DEFAULT_STATUS,
  }));

  return {
    stats: {
      jobLists: listIds.length,
      jobs: jobs.length,
      notApplied: statusCounts[DEFAULT_STATUS],
      applied: statusCounts.applied,
      interview: interviewCount,
      offers: statusCounts.offer,
      rejected: statusCounts.rejected,
      accepted: statusCounts.accepted,
    },
    statusCounts,
    recentJobs,
  };
}

function emptyPayload() {
  const statusCounts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
  return {
    stats: {
      jobLists: 0,
      jobs: 0,
      notApplied: 0,
      applied: 0,
      interview: 0,
      offers: 0,
      rejected: 0,
      accepted: 0,
    },
    statusCounts,
    recentJobs: [],
  };
}

module.exports = { build };
