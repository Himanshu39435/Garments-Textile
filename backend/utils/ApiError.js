/** Error with an HTTP status code, thrown by controllers and handled by ErrorMiddleware. */
export default class ApiError extends Error {
  constructor(statusCode, message, details = null, code = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.code = code; // e.g. EMAIL_NOT_VERIFIED, lets the frontend react without parsing messages
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details) { return new ApiError(400, message, details); }
  static unauthorized(message = 'Please log in to continue') { return new ApiError(401, message); }
  static forbidden(message = 'You do not have permission to do this') { return new ApiError(403, message); }
  static notFound(message = 'Resource not found') { return new ApiError(404, message); }
  static tooManyRequests(message = 'Too many requests. Please try again later.') { return new ApiError(429, message); }
  static conflict(message = 'Resource already exists') { return new ApiError(409, message); }
}
