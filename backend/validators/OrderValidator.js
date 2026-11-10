import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../models/OrderModel.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** POST /api/orders. Addresses are referenced by id; amounts are always recomputed on the server. */
export function validateCheckout({ shippingAddressId, billingAddressId, paymentMethod, notes }) {
  const errors = [];
  if (typeof shippingAddressId !== 'string' || !OBJECT_ID.test(shippingAddressId)) errors.push({ field: 'shippingAddressId', message: 'Choose a delivery address' });
  if (billingAddressId !== undefined && (typeof billingAddressId !== 'string' || !OBJECT_ID.test(billingAddressId))) errors.push({ field: 'billingAddressId', message: 'Invalid billing address' });
  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.push({ field: 'paymentMethod', message: 'Choose a payment method' });
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) errors.push({ field: 'notes', message: 'Notes must be 500 characters or fewer' });
  return errors;
}

/** POST /api/payments/razorpay/verify */
export function validateRazorpayVerification(b) {
  const errors = [];
  if (typeof b.orderId !== 'string' || !OBJECT_ID.test(b.orderId)) errors.push({ field: 'orderId', message: 'Invalid order' });
  for (const field of ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']) {
    if (typeof b[field] !== 'string' || !b[field] || b[field].length > 200) errors.push({ field, message: `${field} is required` });
  }
  return errors;
}

const text = (v, max) => typeof v === 'string' && v.length <= max;

/** PUT /api/admin/orders/:id/status. Shipping needs a courier. */
export function validateStatusChange({ status, note, courier, trackingNumber, trackingUrl }) {
  const errors = [];
  if (!ORDER_STATUSES.includes(status)) errors.push({ field: 'status', message: 'Choose a valid status' });
  if (note !== undefined && !text(note, 300)) errors.push({ field: 'note', message: 'Note must be 300 characters or fewer' });
  if (status === 'shipped') {
    if (typeof courier !== 'string' || courier.trim().length < 2) errors.push({ field: 'courier', message: 'Enter the courier or transport name' });
    if (trackingNumber !== undefined && !text(trackingNumber, 80)) errors.push({ field: 'trackingNumber', message: 'Tracking number is too long' });
    if (trackingUrl !== undefined && trackingUrl !== '' && !/^https?:\/\/\S+$/.test(trackingUrl)) errors.push({ field: 'trackingUrl', message: 'Tracking link must start with http:// or https://' });
  }
  return errors;
}

/** PUT /api/admin/orders/:id/shipment: correct courier details after shipping. */
export function validateShipment({ courier, trackingNumber, trackingUrl }) {
  const errors = [];
  if (typeof courier !== 'string' || courier.trim().length < 2 || courier.length > 80) errors.push({ field: 'courier', message: 'Enter the courier or transport name' });
  if (trackingNumber !== undefined && !text(trackingNumber, 80)) errors.push({ field: 'trackingNumber', message: 'Tracking number is too long' });
  if (trackingUrl !== undefined && trackingUrl !== '' && !/^https?:\/\/\S+$/.test(trackingUrl)) errors.push({ field: 'trackingUrl', message: 'Tracking link must start with http:// or https://' });
  return errors;
}

/** POST mark-paid / mark-refunded. The reference (bank UTR, refund id) is optional. */
export function validateReference({ reference }) {
  return reference !== undefined && !text(reference, 80) ? [{ field: 'reference', message: 'Reference must be 80 characters or fewer' }] : [];
}

/** GET /api/admin/orders query. */
export function validateAdminOrderQuery(q) {
  const errors = [];
  if (q.status !== undefined && !ORDER_STATUSES.includes(q.status)) errors.push({ field: 'status', message: 'Invalid status' });
  if (q.paymentStatus !== undefined && !PAYMENT_STATUSES.includes(q.paymentStatus)) errors.push({ field: 'paymentStatus', message: 'Invalid payment status' });
  if (q.paymentMethod !== undefined && !PAYMENT_METHODS.includes(q.paymentMethod)) errors.push({ field: 'paymentMethod', message: 'Invalid payment method' });
  for (const k of ['from', 'to']) if (q[k] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(q[k])) errors.push({ field: k, message: `${k} must be a date like 2026-11-30` });
  for (const k of ['page', 'limit']) if (q[k] !== undefined && !(Number.isInteger(Number(q[k])) && Number(q[k]) >= 1)) errors.push({ field: k, message: `${k} must be a whole number of 1 or more` });
  return errors;
}
