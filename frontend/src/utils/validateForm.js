/**
 * Ant Design form rules. They mirror backend/validators/AuthValidator.js so users get instant feedback,
 * but the server remains the source of truth and re-validates everything.
 */
export const PHONE_PATTERN = /^(?:\+91|91|0)?[6-9]\d{9}$/;
export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const nameRules = [{ required: true, whitespace: true, message: 'Enter your full name' }, { min: 2, message: 'Enter your full name' }, { max: 80 }];
export const emailRules = [{ required: true, message: 'Enter your email address' }, { type: 'email', message: 'Enter a valid email address' }];

export const phoneRules = [
  { required: true, message: 'Enter your mobile number' },
  { validator: (_, v) => (!v || PHONE_PATTERN.test(v.replace(/[\s-]/g, '')) ? Promise.resolve() : Promise.reject(new Error('Enter a valid 10-digit Indian mobile number'))) },
];

export const gstinRules = [
  { validator: (_, v) => (!v || GSTIN_PATTERN.test(v.trim().toUpperCase()) ? Promise.resolve() : Promise.reject(new Error('Enter a valid 15-character GSTIN'))) },
];

export const passwordRules = [
  { required: true, message: 'Enter a password' },
  { min: 8, message: 'Use at least 8 characters' },
  { max: 72, message: 'Use 72 characters or fewer' },
  { validator: (_, v) => (!v || (/[A-Za-z]/.test(v) && /\d/.test(v)) ? Promise.resolve() : Promise.reject(new Error('Include at least one letter and one number'))) },
];

/** Confirm-password rule that compares against another form field. */
export const confirmRules = (field = 'password') => [
  { required: true, message: 'Re-enter the password' },
  ({ getFieldValue }) => ({ validator: (_, v) => (!v || getFieldValue(field) === v ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))) }),
];
