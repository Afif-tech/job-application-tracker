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
const storage = require('../config/storage');
const AppError = require('../helpers/AppError');

const UPLOADER_INCLUDE = { model: User, as: 'uploader' };

// ── Shared resumes ────────────────────────────────────────────────

async function addShared(job, user, file) {
  if (!file) throw AppError.badRequest('A resume file is required');
  const key = await storage.putFile('shared', file);
  const resume = await SharedResume.create({
    job_id: job.id,
    uploaded_by: user.id,
    original_name: file.originalname,
    stored_path: key,
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
  await storage.deleteFile(stored); // remove object from storage
}

// ── Personal resumes (one per user per job) ───────────────────────

async function upsertPersonal(job, user, file) {
  if (!file) throw AppError.badRequest('A resume file is required');

  // Persist the new object first so a storage failure aborts before any DB write.
  const key = await storage.putFile('personal', file);

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const existing = await UserJobResume.findOne({
        where: { job_id: job.id, user_id: user.id },
        transaction,
      });

      let oldPath = null;
      let record;
      if (existing) {
        oldPath = existing.stored_path;
        existing.original_name = file.originalname;
        existing.stored_path = key;
        existing.mime_type = file.mimetype;
        existing.size_bytes = file.size;
        record = await existing.save({ transaction });
      } else {
        record = await UserJobResume.create(
          {
            job_id: job.id,
            user_id: user.id,
            original_name: file.originalname,
            stored_path: key,
            mime_type: file.mimetype,
            size_bytes: file.size,
          },
          { transaction }
        );
      }
      return { dto: record.toJSONPublic(), oldPath };
    });

    // Remove the replaced object only after the row commits.
    if (result.oldPath && result.oldPath !== key) {
      await storage.deleteFile(result.oldPath);
    }
    return result.dto;
  } catch (err) {
    // Roll back the orphaned upload if the DB write failed.
    await storage.deleteFile(key);
    throw err;
  }
}

async function deletePersonal(job, user) {
  const existing = await UserJobResume.findOne({
    where: { job_id: job.id, user_id: user.id },
  });
  if (!existing) throw AppError.notFound('You have no resume for this job');
  const stored = existing.stored_path;
  await existing.destroy();
  await storage.deleteFile(stored);
}

// ── Download (auth-checked, works for both kinds) ─────────────────

/**
 * Resolves a resume by uuid across both tables and authorizes the caller.
 * Shared resumes: any member of the job's list.
 * Personal resumes: the owning user only (private).
 *
 * @returns {{ storedPath: string, downloadName: string, mimeType: string }}
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
      storedPath: shared.stored_path,
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
      storedPath: personal.stored_path,
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
