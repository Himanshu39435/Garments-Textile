import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const build = (max, message) =>
  rateLimit({ windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)) });

/** General limit per IP per 15 minutes for every /api/auth request. Override with AUTH_RATE_LIMIT_MAX. */
export const authLimiter = build(Number(process.env.AUTH_RATE_LIMIT_MAX) || 60, 'Too many attempts. Please try again in a few minutes.');
/** Tighter limit per IP per 15 minutes for endpoints that send emails. Override with OTP_RATE_LIMIT_MAX. */
export const otpLimiter = build(Number(process.env.OTP_RATE_LIMIT_MAX) || 10, 'Too many code requests. Please try again in a few minutes.');
