const path = require('path');
const multer = require('multer');
const env = require('./env');
const { RESUME_MIME_TYPES, RESUME_EXTENSIONS } = require('../constants');
const AppError = require('../helpers/AppError');

/**
 * Multer instances use in-memory storage so the storage driver (disk or R2)
 * can persist the buffer wherever it likes. authorizeJob runs *before* these
 * in the route chain, so unauthorized requests never buffer a file.
 */
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const okExt = RESUME_EXTENSIONS.includes(ext);
  const okMime = RESUME_MIME_TYPES.includes(file.mimetype);
  if (!okExt || !okMime) {
    return cb(AppError.badRequest('Only PDF, DOC, and DOCX files are allowed'));
  }
  cb(null, true);
}

function buildUploader() {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: env.upload.maxBytes, files: 1 },
  });
}

module.exports = {
  sharedUpload: buildUploader(),
  personalUpload: buildUploader(),
};
