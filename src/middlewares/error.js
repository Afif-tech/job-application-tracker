const { sendError } = require('../helpers/response');
const AppError = require('../helpers/AppError');
const env = require('../config/env');

/**
 * 404 handler for unmatched routes.
 */
function notFound(req, res) {
  return sendError(res, {
    status: 404,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * Central error middleware. Translates known error shapes into the
 * standard error envelope. Must be registered last.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Operational errors we threw on purpose
  if (err instanceof AppError) {
    return sendError(res, {
      status: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  // Sequelize validation / unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return sendError(res, {
      status: 409,
      code: 'CONFLICT',
      message: 'A record with these details already exists',
      details: err.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err.name === 'SequelizeValidationError') {
    return sendError(res, {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    return sendError(res, {
      status: 400,
      code: 'UPLOAD_ERROR',
      message: err.message,
    });
  }

  // JWT errors that slipped past the auth middleware
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, {
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  // Unknown / programmer error
  console.error('[UNHANDLED ERROR]', err);
  return sendError(res, {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: env.isProd ? 'Something went wrong' : err.message,
  });
}

module.exports = { notFound, errorHandler };
