import crypto from 'node:crypto';
import ApiError from '../utils/ApiError.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashOtp = (email, code) => crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${email}:${code}`).digest('hex');

/**
 * Creates a fresh 6-digit code on `user` (must be loaded with '+otp'), saves it, and returns the plain code
 * so the caller can email it. Enforces a resend cooldown.
 */
export async function issueOtp(user, purpose) {
  const waitMs = user.otp?.sentAt ? RESEND_COOLDOWN_MS - (Date.now() - user.otp.sentAt.getTime()) : 0;
  if (waitMs > 0) throw ApiError.tooManyRequests(`Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code`);

  const code = crypto.randomInt(100000, 1000000).toString();
  user.otp = { codeHash: hashOtp(user.email, code), purpose, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, sentAt: new Date() };
  await user.save();
  return code;
}

/** Checks `code` against the stored hash. Counts failures and locks the code after too many. Clears it on success. */
export async function verifyOtp(user, purpose, code) {
  const otp = user.otp;
  const invalid = () => ApiError.badRequest('That code is incorrect or has expired. Request a new one.', null);

  if (!otp?.codeHash || otp.purpose !== purpose || otp.expiresAt < new Date() || otp.attempts >= MAX_ATTEMPTS) throw invalid();

  const expected = Buffer.from(otp.codeHash, 'hex');
  const given = Buffer.from(hashOtp(user.email, code), 'hex');
  if (!crypto.timingSafeEqual(expected, given)) {
    user.otp.attempts += 1;
    await user.save();
    throw invalid();
  }
  user.otp = undefined;
}
