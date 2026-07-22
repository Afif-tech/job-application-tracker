const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('./env');
const AppError = require('../helpers/AppError');

/**
 * Storage driver with two backends chosen at boot:
 *   - Cloudflare R2 (S3-compatible) when all R2_* env vars are set
 *   - Local disk otherwise (dev / no-config)
 *
 * The rest of the app only deals in opaque "keys" (stored_path) and never
 * cares which backend is active.
 */

const SUBDIRS = { shared: 'shared-resumes', personal: 'user-resumes' };
const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads');

const useR2 = !!(
  env.r2.accountId &&
  env.r2.accessKeyId &&
  env.r2.secretAccessKey &&
  env.r2.bucket
);

let s3 = null;
let R2Commands = null;
if (useR2) {
  // Loaded lazily so local dev needn't install/resolve the SDK at all.
  const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
  } = require('@aws-sdk/client-s3');
  R2Commands = { PutObjectCommand, DeleteObjectCommand, GetObjectCommand };
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.accessKeyId,
      secretAccessKey: env.r2.secretAccessKey,
    },
  });
  console.log('✓ Storage driver: Cloudflare R2');
} else {
  for (const dir of Object.values(SUBDIRS)) {
    fs.mkdirSync(path.join(UPLOAD_ROOT, dir), { recursive: true });
  }
  console.log('✓ Storage driver: local disk');
}

function keyFor(kind, originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return `${SUBDIRS[kind]}/${uuidv4()}${ext}`;
}

/**
 * Persists an uploaded (in-memory) file and returns its storage key.
 * @param {'shared'|'personal'} kind
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} file
 * @returns {Promise<string>} storage key (stored_path)
 */
async function putFile(kind, file) {
  const key = keyFor(kind, file.originalname);
  if (useR2) {
    await s3.send(
      new R2Commands.PutObjectCommand({
        Bucket: env.r2.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
  } else {
    const abs = path.join(UPLOAD_ROOT, key);
    await fsp.mkdir(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, file.buffer);
  }
  return key;
}

/** Best-effort delete; never throws. */
async function deleteFile(key) {
  if (!key) return;
  try {
    if (useR2) {
      await s3.send(
        new R2Commands.DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key })
      );
    } else {
      await fsp.unlink(path.join(UPLOAD_ROOT, key));
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[storage] could not delete', key, err.message);
    }
  }
}

/**
 * Returns a readable stream for a stored key, for piping to an HTTP response.
 * @returns {Promise<{ stream: NodeJS.ReadableStream }>}
 */
async function getStream(key) {
  if (useR2) {
    let res;
    try {
      res = await s3.send(
        new R2Commands.GetObjectCommand({ Bucket: env.r2.bucket, Key: key })
      );
    } catch (err) {
      throw AppError.notFound('File is missing from storage');
    }
    return { stream: res.Body };
  }

  const abs = path.join(UPLOAD_ROOT, key);
  if (!fs.existsSync(abs)) {
    throw AppError.notFound('File is missing from storage');
  }
  return { stream: fs.createReadStream(abs) };
}

module.exports = { putFile, deleteFile, getStream, useR2, SUBDIRS };
