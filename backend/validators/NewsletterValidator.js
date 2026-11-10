const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSubscribe({ email }) {
  const errors = [];
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim()) || email.length > 254) {
    errors.push({ field: 'email', message: 'Enter a valid email address' });
  }
  return errors;
}
