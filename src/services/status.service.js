const { UserJobStatus } = require('../models');

const DEFAULT_STATUS = 'not_applied';

/**
 * Returns the caller's status for a job, defaulting to 'not_applied' when
 * they haven't set one yet (no row is created on read).
 */
async function getMine(job, user) {
  const row = await UserJobStatus.findOne({
    where: { job_id: job.id, user_id: user.id },
  });
  if (!row) {
    return { status: DEFAULT_STATUS, appliedAt: null, updatedAt: null };
  }
  return row.toJSONPublic();
}

/**
 * Upserts the caller's status for a job. Stamps applied_at the first time
 * the status becomes 'applied' (and clears it if reset to not_applied).
 */
async function setMine(job, user, status) {
  const [row, created] = await UserJobStatus.findOrCreate({
    where: { job_id: job.id, user_id: user.id },
    defaults: { status, job_id: job.id, user_id: user.id },
  });

  if (!created) {
    row.status = status;
  }

  if (status === 'applied' && !row.applied_at) {
    row.applied_at = new Date();
  } else if (status === 'not_applied') {
    row.applied_at = null;
  }

  await row.save();
  return row.toJSONPublic();
}

module.exports = { getMine, setMine, DEFAULT_STATUS };
