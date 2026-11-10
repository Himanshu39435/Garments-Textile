import { PHONE_PATTERN, emailError, passwordError } from './AuthValidator.js';

const err = (field, message) => ({ field, message });
const isText = (v) => typeof v === 'string';
const compact = (list) => list.filter(Boolean);

const nameError = (name) => (!isText(name) || name.trim().length < 2 || name.length > 80 ? err('name', 'Enter the staff member\'s full name') : null);
const phoneError = (phone) => (!isText(phone) || !PHONE_PATTERN.test(phone.replace(/[\s-]/g, '')) ? err('phone', 'Enter a valid 10-digit Indian mobile number') : null);
const designationError = (d) => (d !== undefined && d !== null && (!isText(d) || d.length > 60) ? err('designation', 'Designation must be 60 characters or fewer') : null);

/** POST /api/admin/staff */
export const validateStaffCreate = ({ name, email, phone, designation, password }) =>
  compact([nameError(name), emailError(email), phoneError(phone), designationError(designation), passwordError(password)]);

/** PUT /api/admin/staff/:id. Every field optional. */
export const validateStaffUpdate = ({ name, phone, designation }) =>
  compact([name !== undefined ? nameError(name) : null, phone !== undefined ? phoneError(phone) : null, designationError(designation)]);

/** PUT /api/admin/staff/:id/status */
export const validateStaffStatus = ({ isActive }) => (typeof isActive === 'boolean' ? [] : [err('isActive', 'isActive must be true or false')]);

/** PUT /api/admin/staff/:id/password */
export const validateStaffPassword = ({ newPassword }) => compact([passwordError(newPassword, 'newPassword')]);
