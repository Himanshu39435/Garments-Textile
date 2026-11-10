import { PHONE_PATTERN, validateBusinessFields } from './AuthValidator.js';

/** PUT /api/customer/profile. Every field is optional, but the ones present must be valid. */
export function validateProfileUpdate(body) {
  const { name, phone, businessType } = body;
  const errors = [...validateBusinessFields(body)];
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.length > 80)) errors.push({ field: 'name', message: 'Enter your full name' });
  if (phone !== undefined && (typeof phone !== 'string' || !PHONE_PATTERN.test(phone.replace(/[\s-]/g, '')))) errors.push({ field: 'phone', message: 'Enter a valid 10-digit Indian mobile number' });
  if (businessType !== undefined && (typeof businessType !== 'string' || businessType.length > 60)) errors.push({ field: 'businessType', message: 'Business type must be 60 characters or fewer' });
  return errors;
}

/** PUT /api/admin/customers/:id/status */
export const validateCustomerStatus = ({ isActive }) => (typeof isActive === 'boolean' ? [] : [{ field: 'isActive', message: 'isActive must be true or false' }]);

export function validateAdminCustomerQuery(q) {
  const errors = [];
  for (const k of ['page', 'limit']) if (q[k] !== undefined && !(Number.isInteger(Number(q[k])) && Number(q[k]) >= 1)) errors.push({ field: k, message: `${k} must be a whole number of 1 or more` });
  if (q.search !== undefined && typeof q.search !== 'string') errors.push({ field: 'search', message: 'search must be text' });
  return errors;
}
