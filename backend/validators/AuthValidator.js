export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^(?:\+91|91|0)?[6-9]\d{9}$/;
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const err = (field, message) => ({ field, message });
const isText = (v) => typeof v === 'string';

export const emailError = (email) => (!isText(email) || !EMAIL_PATTERN.test(email.trim()) || email.length > 254 ? err('email', 'Enter a valid email address') : null);
export const passwordError = (password, field = 'password') => {
  if (!isText(password) || password.length < 8) return err(field, 'Password must be at least 8 characters');
  if (password.length > 72) return err(field, 'Password must be 72 characters or fewer');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return err(field, 'Password must include a letter and a number');
  return null;
};
const otpError = (otp) => (!isText(otp) || !/^\d{6}$/.test(otp) ? err('otp', 'Enter the 6-digit code') : null);
const compact = (list) => list.filter(Boolean);

export function validateBusinessFields({ companyName, gstin }) {
  return compact([
    companyName !== undefined && (!isText(companyName) || companyName.length > 120) ? err('companyName', 'Company name must be 120 characters or fewer') : null,
    gstin && (!isText(gstin) || !GSTIN_PATTERN.test(gstin.trim().toUpperCase())) ? err('gstin', 'Enter a valid 15-character GSTIN') : null,
  ]);
}

export function validateRegister(body) {
  const { name, email, phone, password } = body;
  return compact([
    !isText(name) || name.trim().length < 2 || name.length > 80 ? err('name', 'Enter your full name') : null,
    emailError(email),
    !isText(phone) || !PHONE_PATTERN.test(phone.replace(/[\s-]/g, '')) ? err('phone', 'Enter a valid 10-digit Indian mobile number') : null,
    passwordError(password),
    ...validateBusinessFields(body),
  ]);
}

export const validateLogin = ({ email, password }) => compact([emailError(email), !isText(password) || !password ? err('password', 'Enter your password') : null]);
export const validateEmailOnly = ({ email }) => compact([emailError(email)]);
export const validateVerifyOtp = ({ email, otp }) => compact([emailError(email), otpError(otp)]);
export const validateResetPassword = ({ email, otp, newPassword }) => compact([emailError(email), otpError(otp), passwordError(newPassword, 'newPassword')]);
export const validateChangePassword = ({ currentPassword, newPassword }) =>
  compact([!isText(currentPassword) || !currentPassword ? err('currentPassword', 'Enter your current password') : null, passwordError(newPassword, 'newPassword'),
    currentPassword && currentPassword === newPassword ? err('newPassword', 'New password must be different from the current one') : null]);
