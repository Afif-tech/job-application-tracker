/**
 * Operational error carrying an HTTP status and a stable machine code.
 * Thrown from services/controllers and translated to the standard
 * error envelope by the central error middleware.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode  HTTP status code
   * @param {string} code        Stable machine-readable code (e.g. NOT_FOUND)
   * @param {string} message     Human-readable message
   * @param {Array}  [details]   Optional field-level details
   */
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message, details) {
    return new AppError(409, 'CONFLICT', message, details);
  }

  static validation(message = 'Validation failed', details) {
    return new AppError(422, 'VALIDATION_ERROR', message, details);
  }
}

module.exports = AppError;
