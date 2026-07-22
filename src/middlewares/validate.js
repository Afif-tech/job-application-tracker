const AppError = require('../helpers/AppError');

/**
 * Builds a middleware that validates the given request segments against
 * Joi schemas. Validated (and coerced) values overwrite the request data.
 *
 * @param {{ body?, params?, query? }} schemas
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    const details = [];

    for (const segment of ['params', 'query', 'body']) {
      const schema = schemas[segment];
      if (!schema) continue;

      const { error, value } = schema.validate(req[segment], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        for (const d of error.details) {
          details.push({ field: d.path.join('.'), message: d.message });
        }
      } else {
        // `req.query` is a getter in Express 5; assign per-key to stay safe.
        if (segment === 'query') {
          for (const k of Object.keys(req.query)) delete req.query[k];
          Object.assign(req.query, value);
        } else {
          req[segment] = value;
        }
      }
    }

    if (details.length) {
      return next(AppError.validation('Validation failed', details));
    }
    return next();
  };
}

module.exports = { validate };
