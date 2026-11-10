import { QUOTATION_STATUSES } from '../models/QuotationModel.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isWhole = (v) => Number.isInteger(v) && v >= 1 && v <= 1000000;
const isMoney = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 10000000;

/** India's calendar date n days from now, as YYYY-MM-DD. */
export function istDate(offsetDays = 0) {
  return new Date(Date.now() + 330 * 60 * 1000 + offsetDays * 86400000).toISOString().slice(0, 10);
}

/** POST /api/quotations */
export function validateQuoteRequest({ items, notes, requiredBy }) {
  const errors = [];
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) errors.push({ field: 'items', message: 'Add between 1 and 20 fabrics to your request' });
  else items.forEach((i, n) => {
    if (typeof i?.productId !== 'string' || !OBJECT_ID.test(i.productId)) errors.push({ field: `items.${n}.productId`, message: `Line ${n + 1}: choose a fabric` });
    if (!isWhole(i?.quantity)) errors.push({ field: `items.${n}.quantity`, message: `Line ${n + 1}: quantity must be a whole number of metres` });
    if (i?.requestedPrice !== undefined && i.requestedPrice !== null && !isMoney(i.requestedPrice)) errors.push({ field: `items.${n}.requestedPrice`, message: `Line ${n + 1}: target price must be a positive amount` });
  });
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 1000)) errors.push({ field: 'notes', message: 'Notes must be 1000 characters or fewer' });
  if (requiredBy !== undefined && requiredBy !== null && requiredBy !== '') {
    if (typeof requiredBy !== 'string' || !DATE.test(requiredBy) || requiredBy < istDate(0) || requiredBy > istDate(365)) errors.push({ field: 'requiredBy', message: 'Choose a delivery date within the next year' });
  }
  return errors;
}

/** PUT /api/admin/quotations/:id/approve */
export function validateApproval({ items, discountPercent, shippingCharge, validUntil, adminNote }) {
  const errors = [];
  if (!Array.isArray(items) || items.length < 1) errors.push({ field: 'items', message: 'Give a price for every item' });
  else items.forEach((i, n) => {
    if (typeof i?.productId !== 'string' || !OBJECT_ID.test(i.productId)) errors.push({ field: `items.${n}.productId`, message: `Line ${n + 1}: invalid item` });
    if (!isWhole(i?.quantity)) errors.push({ field: `items.${n}.quantity`, message: `Line ${n + 1}: quantity must be a whole number of metres` });
    if (!isMoney(i?.quotedPrice)) errors.push({ field: `items.${n}.quotedPrice`, message: `Line ${n + 1}: enter a price per metre` });
  });
  if (discountPercent !== undefined && (typeof discountPercent !== 'number' || !(discountPercent >= 0 && discountPercent <= 50))) errors.push({ field: 'discountPercent', message: 'Discount must be between 0 and 50 percent' });
  if (shippingCharge !== undefined && (typeof shippingCharge !== 'number' || !(shippingCharge >= 0 && shippingCharge <= 100000))) errors.push({ field: 'shippingCharge', message: 'Shipping must be between 0 and 100000' });
  if (typeof validUntil !== 'string' || !DATE.test(validUntil) || validUntil < istDate(0) || validUntil > istDate(90)) errors.push({ field: 'validUntil', message: 'Choose a validity date from today up to 90 days ahead' });
  if (adminNote !== undefined && (typeof adminNote !== 'string' || adminNote.length > 500)) errors.push({ field: 'adminNote', message: 'Message must be 500 characters or fewer' });
  return errors;
}

export const validateRejection = ({ reason }) => (reason !== undefined && (typeof reason !== 'string' || reason.length > 300) ? [{ field: 'reason', message: 'Reason must be 300 characters or fewer' }] : []);

export function validateQuotationQuery(q) {
  const errors = [];
  if (q.status !== undefined && ![...QUOTATION_STATUSES, 'expired'].includes(q.status)) errors.push({ field: 'status', message: 'Invalid status' });
  for (const k of ['page', 'limit']) if (q[k] !== undefined && !(Number.isInteger(Number(q[k])) && Number(q[k]) >= 1)) errors.push({ field: k, message: `${k} must be a whole number of 1 or more` });
  return errors;
}
