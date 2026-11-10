import { PHONE_PATTERN } from './AuthValidator.js';
import { INDIAN_STATES } from '../config/indianStates.js';

const text = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

/** Create or replace an address. All required fields must be present. */
export function validateAddress(b) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  if (!text(b.fullName, 2, 80)) add('fullName', 'Enter the recipient name');
  if (typeof b.phone !== 'string' || !PHONE_PATTERN.test(b.phone.replace(/[\s-]/g, ''))) add('phone', 'Enter a valid 10-digit Indian mobile number');
  if (!text(b.line1, 3, 160)) add('line1', 'Enter the street address');
  if (b.line2 !== undefined && b.line2 !== '' && !text(b.line2, 1, 160)) add('line2', 'Address line 2 is too long');
  if (!text(b.city, 2, 80)) add('city', 'Enter the city');
  if (typeof b.stateCode !== 'string' || !INDIAN_STATES.some((s) => s.code === b.stateCode)) add('stateCode', 'Choose a state');
  if (typeof b.pincode !== 'string' || !/^[1-9]\d{5}$/.test(b.pincode)) add('pincode', 'Enter a valid 6-digit pincode');
  if (b.companyName !== undefined && b.companyName !== '' && !text(b.companyName, 1, 120)) add('companyName', 'Company name is too long');
  if (b.label !== undefined && b.label !== '' && !text(b.label, 1, 40)) add('label', 'Label must be 40 characters or fewer');
  return errors;
}
