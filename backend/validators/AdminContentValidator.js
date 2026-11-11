const text = (value, max) => typeof value === 'string' && value.trim().length <= max;
const nonNegative = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const validUrl = (value) => value === '' || (typeof value === 'string' && /^https?:\/\/\S+$/i.test(value));
const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function validateCouponInput(body) {
  const errors = [];
  if (typeof body.code !== 'string' || !/^[A-Za-z0-9_-]{3,30}$/.test(body.code.trim())) errors.push({ field: 'code', message: 'Coupon code must be 3 to 30 letters, numbers, - or _' });
  if (!['percent', 'fixed'].includes(body.discountType)) errors.push({ field: 'discountType', message: 'Choose a percentage or fixed discount' });
  if (!nonNegative(body.discountValue) || body.discountValue === 0 || (body.discountType === 'percent' && body.discountValue > 100)) errors.push({ field: 'discountValue', message: 'Enter a valid discount amount' });
  if (body.maxDiscount !== undefined && body.maxDiscount !== null && body.maxDiscount !== '' && !nonNegative(body.maxDiscount)) errors.push({ field: 'maxDiscount', message: 'Maximum discount must be 0 or more' });
  if (body.discountType === 'fixed' && body.maxDiscount) errors.push({ field: 'maxDiscount', message: 'Maximum discount only applies to percentage coupons' });
  if (body.minimumOrder !== undefined && !nonNegative(body.minimumOrder)) errors.push({ field: 'minimumOrder', message: 'Minimum order must be 0 or more' });
  if (body.expiresAt !== undefined && body.expiresAt !== null && body.expiresAt !== '' && !validDate(body.expiresAt)) errors.push({ field: 'expiresAt', message: 'Enter a valid expiry date in YYYY-MM-DD format' });
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') errors.push({ field: 'isActive', message: 'Active must be true or false' });
  return errors;
}

export function validateWebsiteSettings(body) {
  const errors = [];
  const fields = {
    brandName: 120, logoUrl: 500, email: 254, phone: 30, address: 500, whatsapp: 30,
    instagramUrl: 500, facebookUrl: 500, youtubeUrl: 500, legalBusinessName: 160,
    gstin: 15, state: 80, hsnCode: 8, returnPolicy: 5000, privacyPolicy: 5000, terms: 5000,
  };
  for (const [field, max] of Object.entries(fields)) {
    if (body[field] !== undefined && !text(body[field], max)) errors.push({ field, message: `${field} must be text of ${max} characters or fewer` });
  }
  for (const field of ['logoUrl', 'instagramUrl', 'facebookUrl', 'youtubeUrl']) {
    if (body[field] !== undefined && !validUrl(body[field])) errors.push({ field, message: `${field} must be a complete http or https URL` });
  }
  if (body.email !== undefined && body.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push({ field: 'email', message: 'Enter a valid email address' });
  for (const field of ['shippingCharge', 'freeShippingAbove']) {
    if (body[field] !== undefined && !nonNegative(body[field])) errors.push({ field, message: `${field} must be 0 or more` });
  }
  if (body.gstRate !== undefined && (!nonNegative(body.gstRate) || body.gstRate > 28)) errors.push({ field: 'gstRate', message: 'GST rate must be between 0 and 28' });
  if (body.banners !== undefined) {
    if (!Array.isArray(body.banners) || body.banners.length > 10) errors.push({ field: 'banners', message: 'Add up to 10 banners' });
    else body.banners.forEach((banner, index) => {
      if (!text(banner?.title ?? '', 100) || !text(banner?.imageUrl ?? '', 500) || !validUrl(banner?.imageUrl ?? '') || !text(banner?.linkUrl ?? '', 500) || !validUrl(banner?.linkUrl ?? '') || typeof banner?.isActive !== 'boolean') {
        errors.push({ field: `banners.${index}`, message: `Banner ${index + 1} has invalid details` });
      }
    });
  }
  return errors;
}

export function validateReportQuery(query) {
  const errors = [];
  if (query.groupBy !== undefined && !['daily', 'weekly', 'monthly'].includes(query.groupBy)) errors.push({ field: 'groupBy', message: 'Group by must be daily, weekly or monthly' });
  for (const field of ['from', 'to']) {
    if (query[field] !== undefined && !validDate(query[field])) errors.push({ field, message: `${field} must be a valid date in YYYY-MM-DD format` });
  }
  if (query.from && query.to && query.from > query.to) errors.push({ field: 'from', message: 'Start date must be before end date' });
  return errors;
}

export function validateAdminPaymentQuery(query) {
  const errors = [];
  if (query.method !== undefined && !['razorpay', 'bank_transfer'].includes(query.method)) errors.push({ field: 'method', message: 'Choose a supported payment method' });
  if (query.status !== undefined && !['pending', 'awaiting_transfer', 'paid', 'failed', 'refunded'].includes(query.status)) errors.push({ field: 'status', message: 'Choose a supported payment status' });
  return errors;
}
