const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const env = require('./env');
const { RESUME_MIME_TYPES, RESUME_EXTENSIONS } = require('../constants');
const AppError = require('../helpers/AppError');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads');
const SUBDIRS = {
  shared: 'shared-resumes',
  personal: 'user-resumes',
};

// Ensure target folders exist at startup.
for (const dir of Object.values(SUBDIRS)) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, dir), { recursive: true });
}

function resolveStoredPath(relativePath) {
  return path.join(UPLOAD_ROOT, relativePath);
}

/**
 * Builds a Multer instance that writes to the given subdir with a
 * randomized filename, rejecting anything outside the resume allowlist.
 */
function buildUploader(kind) {
  const subdir = SUBDIRS[kind];

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, subdir)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });

  function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = RESUME_EXTENSIONS.includes(ext);
    const okMime = RESUME_MIME_TYPES.includes(file.mimetype);
    if (!okExt || !okMime) {
      return cb(
        AppError.badRequest('Only PDF, DOC, and DOCX files are allowed')
      );
    }
    cb(null, true);
  }

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: env.upload.maxBytes, files: 1 },
  });
}

module.exports = {
  UPLOAD_ROOT,
  SUBDIRS,
  resolveStoredPath,
  sharedUpload: buildUploader('shared'),
  personalUpload: buildUploader('personal'),
};
