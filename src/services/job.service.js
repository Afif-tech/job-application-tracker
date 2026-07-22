const { Op } = require('sequelize');
const { Job, User, SharedResume, UserJobResume, UserJobStatus } = require('../models');
const { ROLES } = require('../constants');
const { DEFAULT_STATUS } = require('./status.service');

const CREATOR_INCLUDE = { model: User, as: 'creator' };

function canManage(job, membership, user) {
  return membership.role === ROLES.OWNER || job.created_by === user.id;
}

/**
 * Shapes a job's per-viewer data: all shared resumes (with a per-viewer
 * canDelete flag), the viewer's own personal resume, and the viewer's own
 * application status (defaulting when unset).
 */
function shapeViewer(job, membership, user) {
  const isOwner = membership.role === ROLES.OWNER;
  const shared = (job.sharedResumes || [])
    .slice()
    .sort((a, b) => b.created_at - a.created_at)
    .map((r) =>
      r.toJSONPublic({ canDelete: isOwner || r.uploaded_by === user.id })
    );
  const mine = (job.userResumes || []).find((r) => r.user_id === user.id);
  const statusRow = (job.userStatuses || []).find((s) => s.user_id === user.id);

  return {
    sharedResumes: shared,
    myResume: mine ? mine.toJSONPublic() : null,
    myStatus: statusRow
      ? statusRow.toJSONPublic()
      : { status: DEFAULT_STATUS, appliedAt: null, updatedAt: null },
  };
}

function resumeIncludes() {
  return [
    CREATOR_INCLUDE,
    { model: SharedResume, as: 'sharedResumes', include: [{ model: User, as: 'uploader' }] },
    { model: UserJobResume, as: 'userResumes' },
    { model: UserJobStatus, as: 'userStatuses' },
  ];
}

/**
 * Lists jobs in a list, newest first, annotated per viewer. Supports
 * filtering: DB-level for search/platform/createdBy, and post-shape for
 * status (the viewer's own) and hasResume (a shared resume exists).
 *
 * @param {object} [filters]
 * @param {string} [filters.search]     matched against company/title/location
 * @param {string} [filters.platform]   exact platform value
 * @param {string} [filters.createdBy]  creator user uuid
 * @param {string} [filters.status]     the viewer's own application status
 * @param {boolean}[filters.hasResume]  true → only jobs with a shared resume
 */
async function listForList(jobList, membership, user, filters = {}) {
  const where = { job_list_id: jobList.id };

  if (filters.search) {
    const like = { [Op.like]: `%${filters.search}%` };
    where[Op.or] = [
      { company_name: like },
      { job_title: like },
      { location: like },
    ];
  }
  if (filters.platform) {
    where.platform = filters.platform;
  }
  if (filters.createdBy) {
    const creator = await User.findOne({ where: { uuid: filters.createdBy } });
    // Unknown user → match nothing.
    where.created_by = creator ? creator.id : 0;
  }

  const jobs = await Job.findAll({
    where,
    include: resumeIncludes(),
    order: [['created_at', 'DESC']],
  });

  let shaped = jobs.map((job) => ({
    dto: job.toJSONPublic({
      canManage: canManage(job, membership, user),
      ...shapeViewer(job, membership, user),
    }),
  }));

  if (filters.status) {
    shaped = shaped.filter((s) => s.dto.myStatus.status === filters.status);
  }
  if (filters.hasResume === true) {
    shaped = shaped.filter((s) => s.dto.sharedResumes.length > 0);
  }

  return shaped.map((s) => s.dto);
}

async function create(jobList, user, payload) {
  const job = await Job.create({
    job_list_id: jobList.id,
    company_name: payload.companyName,
    job_title: payload.jobTitle,
    original_url: payload.originalUrl,
    platform: payload.platform,
    location: payload.location || null,
    salary: payload.salary || null,
    notes: payload.notes || null,
    expiry_date: payload.expiryDate || null,
    created_by: user.id,
    updated_by: user.id,
  });
  const reloaded = await Job.findByPk(job.id, { include: [CREATOR_INCLUDE] });
  // Creator can always manage their own new job; no resumes yet.
  return reloaded.toJSONPublic({ canManage: true, sharedResumes: [], myResume: null, myStatus: { status: DEFAULT_STATUS, appliedAt: null, updatedAt: null } });
}

async function getOne(job, membership, user, canManageFlag) {
  const full = await Job.findByPk(job.id, { include: resumeIncludes() });
  return full.toJSONPublic({
    canManage: canManageFlag,
    ...shapeViewer(full, membership, user),
  });
}

async function update(job, membership, user, payload) {
  const map = {
    companyName: 'company_name',
    jobTitle: 'job_title',
    originalUrl: 'original_url',
    platform: 'platform',
    location: 'location',
    salary: 'salary',
    notes: 'notes',
    expiryDate: 'expiry_date',
  };
  for (const [key, column] of Object.entries(map)) {
    if (payload[key] !== undefined) {
      job[column] = payload[key] === '' ? null : payload[key];
    }
  }
  job.updated_by = user.id;
  await job.save();
  const reloaded = await Job.findByPk(job.id, { include: resumeIncludes() });
  return reloaded.toJSONPublic({
    canManage: true,
    ...shapeViewer(reloaded, membership, user),
  });
}

async function remove(job) {
  await job.destroy();
}

module.exports = { listForList, create, getOne, update, remove };
