import User, { compareAgainstDummy } from '../models/UserModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { generateToken } from '../utils/GenerateToken.js';
import { issueOtp, verifyOtp } from '../services/OTPService.js';
import { sendOtpEmail } from '../services/EmailService.js';

const normaliseEmail = (email) => email.trim().toLowerCase();
const normalisePhone = (phone) => phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
const findWithSecrets = (email) => User.findOne({ email: normaliseEmail(email) }).select('+password +otp');
const sessionResponse = (res, user, message) => ApiResponse.ok(res, { token: generateToken(user), user: user.toPublic() }, message);

async function sendCode(user, purpose) {
  const code = await issueOtp(user, purpose);
  try {
    await sendOtpEmail({ to: user.email, name: user.name, code, purpose });
  } catch (error) {
    user.otp = undefined;
    await user.save();
    throw error;
  }
}

/** POST /api/auth/register. Creates an unverified account and emails a code. */
export async function register(req, res, next) {
  try {
    const { name, email, phone, password, companyName, gstin } = req.body;
    let user = await findWithSecrets(email);

    if (user?.isEmailVerified) throw ApiError.conflict('An account with this email already exists. Try logging in.');

    if (user) {
      // Pending account: never overwrite its password (the real owner may not be the one calling). Refresh profile fields only.
      user.name = name.trim();
      user.phone = normalisePhone(phone);
    } else {
      user = new User({ name: name.trim(), email: normaliseEmail(email), phone: normalisePhone(phone), password, role: 'customer' });
    }
    user.business = { companyName: companyName?.trim() || undefined, gstin: gstin?.trim().toUpperCase() || undefined };

    await sendCode(user, 'verify');
    return ApiResponse.created(res, { email: user.email }, 'We sent a 6-digit code to your email');
  } catch (error) {
    return next(error);
  }
}

/** POST /api/auth/verify-otp. Confirms the email and signs the customer in. */
export async function verifyEmail(req, res, next) {
  try {
    const user = await findWithSecrets(req.body.email);
    if (!user) throw ApiError.badRequest('That code is incorrect or has expired. Request a new one.');
    await verifyOtp(user, 'verify', req.body.otp);
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
    return sessionResponse(res, user, 'Email verified. Welcome to NARANG TEXTILE');
  } catch (error) {
    return next(error);
  }
}

/** POST /api/auth/resend-otp. Same response whether or not the account exists. */
export async function resendOtp(req, res, next) {
  try {
    const user = await findWithSecrets(req.body.email);
    if (user && !user.isEmailVerified) await sendCode(user, 'verify');
    return ApiResponse.ok(res, null, 'If that email needs verification, a new code is on its way');
  } catch (error) {
    return next(error);
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await findWithSecrets(email);
    const passwordOk = user ? await user.comparePassword(password) : await compareAgainstDummy(password);
    if (!user || !passwordOk) throw ApiError.unauthorized('Incorrect email or password');
    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated. Contact support.');

    if (!user.isEmailVerified) {
      await sendCode(user, 'verify').catch((e) => { if (e.statusCode !== 429) throw e; }); // cooldown: an earlier code is still valid
      throw new ApiError(403, 'Please verify your email to continue. We sent you a code.', null, 'EMAIL_NOT_VERIFIED');
    }

    user.lastLoginAt = new Date();
    await user.save();
    return sessionResponse(res, user, 'Logged in');
  } catch (error) {
    return next(error);
  }
}

/** POST /api/auth/forgot-password. Always answers the same way so emails cannot be probed. */
export async function forgotPassword(req, res, next) {
  try {
    const user = await findWithSecrets(req.body.email);
    if (user?.isActive) await sendCode(user, 'reset');
    return ApiResponse.ok(res, null, 'If an account exists for that email, we sent a 6-digit code');
  } catch (error) {
    return next(error);
  }
}

/** POST /api/auth/reset-password. A correct code also proves email ownership, so it verifies pending accounts. */
export async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await findWithSecrets(email);
    if (!user) throw ApiError.badRequest('That code is incorrect or has expired. Request a new one.');
    await verifyOtp(user, 'reset', otp);
    user.password = newPassword;
    user.isEmailVerified = true;
    await user.save();
    return ApiResponse.ok(res, null, 'Password updated. You can log in now.');
  } catch (error) {
    return next(error);
  }
}

/** GET /api/auth/me */
export const getCurrentUser = (req, res) => ApiResponse.ok(res, { user: req.user.toPublic() });

/** PUT /api/auth/password. Returns a fresh token because older ones stop working. */
export async function changePassword(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) throw ApiError.badRequest('Your current password is incorrect');
    user.password = req.body.newPassword;
    await user.save();
    return sessionResponse(res, user, 'Password changed');
  } catch (error) {
    return next(error);
  }
}
