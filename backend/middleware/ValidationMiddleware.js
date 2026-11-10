import ApiError from '../utils/ApiError.js';

const run = (source, validator) => (req, _res, next) => {
  const errors = validator(req[source] ?? {});
  if (errors.length) return next(ApiError.badRequest(errors[0].message, errors));
  return next();
};

/** Validate req.body with `(body) => [{ field, message }]`. Responds 400 when it returns errors. */
export const validateBody = (validator) => run('body', validator);

/** Validate req.query the same way. Validators live in backend/validators/. */
export const validateQuery = (validator) => run('query', validator);
