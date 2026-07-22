const fs = require('fs');
const resumeService = require('../services/resume.service');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');
const AppError = require('../helpers/AppError');

const uploadShared = asyncHandler(async (req, res) => {
  const resume = await resumeService.addShared(req.job, req.user, req.file);
  return sendSuccess(res, {
    status: 201,
    message: 'Shared resume uploaded',
    data: { resume },
  });
});

const deleteShared = asyncHandler(async (req, res) => {
  await resumeService.deleteShared(req.params.resumeId, req.user);
  return sendSuccess(res, { message: 'Shared resume deleted' });
});

const uploadMine = asyncHandler(async (req, res) => {
  const resume = await resumeService.upsertPersonal(req.job, req.user, req.file);
  return sendSuccess(res, { message: 'Your resume was saved', data: { resume } });
});

const deleteMine = asyncHandler(async (req, res) => {
  await resumeService.deletePersonal(req.job, req.user);
  return sendSuccess(res, { message: 'Your resume was removed' });
});

const download = asyncHandler(async (req, res) => {
  const { absPath, downloadName, mimeType } = await resumeService.resolveForDownload(
    req.params.resumeId,
    req.user
  );

  if (!fs.existsSync(absPath)) {
    throw AppError.notFound('File is missing from storage');
  }

  res.setHeader('Content-Type', mimeType);
  res.download(absPath, downloadName);
});

module.exports = { uploadShared, deleteShared, uploadMine, deleteMine, download };
