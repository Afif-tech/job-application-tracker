const fs = require('fs/promises');
const path = require('path');
const {
  sequelize,
  Job,
  JobList,
  JobListMember,
  SharedResume,
  UserJobResume,
  User,
} = require('../models');
const { ROLES } = require('../constants');
const { SUBDIRS, resolveStoredPath } = require('../config/multer');
const AppError = require('../helpers/AppError');

const UPLOADER_INCLUDE = { model: User, as: 'uploader' };

/** Best-effort removal of a stored file; never throws. */
async function unlinkQuiet(relativePath) {
  if (!relativePath) return;
  try {
    await fs.unlink(resolveStoredPath(relativePath));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[resume] could not delete file', relativePath, err.message);
    }
  }
}

function toRelative(file, kind) {
  // stored relative to the uploads root, using forward slashes
  return `${SUBDIRS[kind]}/${file.filename}`;
}

// ── Shared resumes ────────────────────────────────────────────────

async function addShared(job, user, file) {
  if (!file) throw AppError.badRequest('A resume file is required');
  const resume = await SharedResume.create({
    job_id: job.id,
    uploaded_by: user.id,
    original_name: file.originalname,
    stored_path: toRelative(file, 'shared'),
    mime_type: file.mimetype,
    size_bytes: file.size,
  });
  const reloaded = await SharedResume.findByPk(resume.id, { include: [UPLOADER_INCLUDE] });
  return reloaded.toJSONPublic({ canDelete: true });
}

/**
 * Deletes a shared resume. Allowed for the original uploader or the list owner.
 */
async function deleteShared(resumeUuid, user) {
  const resume = await SharedResume.findOne({
    where: { uuid: resumeUuid },
    include: [{ model: Job, as: 'job' }],
  });
  if (!resume || !resume.job) throw AppError.notFound('Resume not found');

  const membership = await JobListMember.findOne({
    where: { job_list_id: resume.job.job_list_id, user_id: user.id },
  });
  if (!membership) throw AppError.notFound('Resume not found');

  const isUploader = resume.uploaded_by === user.id;
  const isOwner = membership.role === ROLES.OWNER;
  if (!isUploader && !isOwner) {
    throw AppError.forbidden('Only the uploader or list owner can delete this resume');
  }

  const stored = resume.stored_path;
  await resume.destroy(); // soft delete row
  await unlinkQuiet(stored); // remove file from disk
}

// ── Personal resumes (one per user per job) ───────────────────────

async function upsertPersonal(job, user, file) {
  if (!file) throw AppError.badRequest('A resume file is required');

  return sequelize.transaction(async (transaction) => {
    const existing = await UserJobResume.findOne({
      where: { job_id: job.id, user_id: user.id },
      transaction,
    });

    let oldPath = null;
    let record;
    if (existing) {
      oldPath = existing.stored_path;
      existing.original_name = file.originalname;
      existing.stored_path = toRelative(file, 'personal');
      existing.mime_type = file.mimetype;
      existing.size_bytes = file.size;
      record = await existing.save({ transaction });
    } else {
      record = await UserJobResume.create(
        {
          job_id: job.id,
          user_id: user.id,
          original_name: file.originalname,
          stored_path: toRelative(file, 'personal'),
          mime_type: file.mimetype,
          size_bytes: file.size,
        },
        { transaction }
      );
    }

    // Remove the replaced file only after the row commits.
    if (oldPath && oldPath !== record.stored_path) {
      await unlinkQuiet(oldPath);
    }
    return record.toJSONPublic();
  });
}

async function deletePersonal(job, user) {
  const existing = await UserJobResume.findOne({
    where: { job_id: job.id, user_id: user.id },
  });
  if (!existing) throw AppError.notFound('You have no resume for this job');
  const stored = existing.stored_path;
  await existing.destroy();
  await unlinkQuiet(stored);
}

// ── Download (auth-checked, works for both kinds) ─────────────────

/**
 * Resolves a resume by uuid across both tables and authorizes the caller.
 * Shared resumes: any member of the job's list.
 * Personal resumes: the owning user only (private).
 *
 * @returns {{ absPath: string, downloadName: string, mimeType: string }}
 */
async function resolveForDownload(resumeUuid, user) {
  // Try shared first.
  const shared = await SharedResume.findOne({
    where: { uuid: resumeUuid },
    include: [{ model: Job, as: 'job' }],
  });
  if (shared) {
    if (!shared.job) throw AppError.notFound('Resume not found');
    const membership = await JobListMember.findOne({
      where: { job_list_id: shared.job.job_list_id, user_id: user.id },
    });
    if (!membership) throw AppError.notFound('Resume not found');
    return {
      absPath: resolveStoredPath(shared.stored_path),
      downloadName: shared.original_name,
      mimeType: shared.mime_type,
    };
  }

  // Then personal — private to its owner.
  const personal = await UserJobResume.findOne({ where: { uuid: resumeUuid } });
  if (personal) {
    if (personal.user_id !== user.id) {
      throw AppError.notFound('Resume not found');
    }
    return {
      absPath: resolveStoredPath(personal.stored_path),
      downloadName: personal.original_name,
      mimeType: personal.mime_type,
    };
  }

  throw AppError.notFound('Resume not found');
}

module.exports = {
  addShared,
  deleteShared,
  upsertPersonal,
  deletePersonal,
  resolveForDownload,
};
