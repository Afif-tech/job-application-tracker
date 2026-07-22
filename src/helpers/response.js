/**
 * Standard JSON response envelope helpers.
 * success: { success: true, data, message?, meta? }
 * error:   { success: false, error: { code, message, details? } }
 */

function sendSuccess(res, { status = 200, data = null, message, meta } = {}) {
  const body = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function sendError(res, { status = 500, code = 'INTERNAL_ERROR', message = 'Something went wrong', details } = {}) {
  const error = { code, message };
  if (details) error.details = details;
  return res.status(status).json({ success: false, error });
}

module.exports = { sendSuccess, sendError };
