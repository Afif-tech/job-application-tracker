const resumeService = require('../services/resume.service');
const storage = require('../config/storage');
const asyncHandler = require('../helpers/asyncHandler');
const { sendSuccess } = require('../helpers/response');

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
  const { storedPath, downloadName, mimeType } = await resumeService.resolveForDownload(
    req.params.resumeId,
    req.user
  );

  const { stream } = await storage.getStream(storedPath);

  const safeName = encodeURIComponent(downloadName);
  res.setHeader('Content-Type', mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${downloadName.replace(/"/g, '')}"; filename*=UTF-8''${safeName}`
  );

  stream.on('error', () => {
    if (!res.headersSent) res.status(500).end();
    else res.destroy();
  });
  stream.pipe(res);
});

module.exports = { uploadShared, deleteShared, uploadMine, deleteMine, download };
