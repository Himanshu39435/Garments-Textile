import { FABRIC_TYPES, PRODUCT_STATUSES } from '../models/ProductModel.js';

export const SORT_OPTIONS = ['newest', 'popular', 'price_asc', 'price_desc', 'name'];

const isNonNegativeNumber = (v) => v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) >= 1;

/** Validates GET /api/products query parameters. */
export function validateProductListQuery(query) {
  const errors = [];
  const { page, limit, minPrice, maxPrice, sort, fabric, flag } = query;

  if (page !== undefined && !isPositiveInt(page)) errors.push({ field: 'page', message: 'page must be a whole number of 1 or more' });
  if (limit !== undefined && !isPositiveInt(limit)) errors.push({ field: 'limit', message: 'limit must be a whole number of 1 or more' });
  if (minPrice !== undefined && !isNonNegativeNumber(minPrice)) errors.push({ field: 'minPrice', message: 'minPrice must be a number of 0 or more' });
  if (maxPrice !== undefined && !isNonNegativeNumber(maxPrice)) errors.push({ field: 'maxPrice', message: 'maxPrice must be a number of 0 or more' });
  if (isNonNegativeNumber(minPrice) && isNonNegativeNumber(maxPrice) && Number(minPrice) > Number(maxPrice)) {
    errors.push({ field: 'minPrice', message: 'minPrice cannot be higher than maxPrice' });
  }
  if (sort !== undefined && !SORT_OPTIONS.includes(sort)) errors.push({ field: 'sort', message: `sort must be one of: ${SORT_OPTIONS.join(', ')}` });
  if (flag !== undefined && !['best', 'new'].includes(flag)) errors.push({ field: 'flag', message: 'flag must be best or new' });
  if (fabric !== undefined) {
    const bad = String(fabric).split(',').filter((f) => !FABRIC_TYPES.includes(f));
    if (bad.length) errors.push({ field: 'fabric', message: `Unknown fabric type: ${bad.join(', ')}` });
  }
  for (const key of ['search', 'category', 'color']) {
    if (query[key] !== undefined && typeof query[key] !== 'string') errors.push({ field: key, message: `${key} must be text` });
  }
  return errors;
}

const OBJECT_ID = /^[a-f\d]{24}$/i;
const HEX = /^#[0-9a-f]{6}$/i;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const text = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

/** Create or update a product (admin). Every business rule that protects pricing and stock lives here. */
export function validateProductInput(b) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  if (!text(b.name, 2, 140)) add('name', 'Enter the product name (2 to 140 characters)');
  if (b.slug !== undefined && b.slug !== '' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.slug)) add('slug', 'Slug can use lowercase letters, numbers and single hyphens');
  if (typeof b.sku !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{2,29}$/.test(b.sku.trim())) add('sku', 'SKU must be 3 to 30 characters: letters, numbers, - or _');
  if (b.description !== undefined && (typeof b.description !== 'string' || b.description.length > 4000)) add('description', 'Description must be 4000 characters or fewer');
  if (typeof b.category !== 'string' || !OBJECT_ID.test(b.category)) add('category', 'Choose a category');
  if (!FABRIC_TYPES.includes(b.fabricType)) add('fabricType', 'Choose a fabric type');
  if (!text(b.composition, 2, 120)) add('composition', 'Enter the composition, e.g. 100% Cotton');
  if (!isNum(b.gsm) || b.gsm < 10 || b.gsm > 1000) add('gsm', 'GSM must be between 10 and 1000');
  if (!isNum(b.width) || b.width < 10 || b.width > 120) add('width', 'Width must be between 10 and 120 inches');
  if (!isNum(b.price) || b.price < 0 || b.price > 10000000) add('price', 'Enter a price per metre of 0 or more');
  if (!Number.isInteger(b.moq) || b.moq < 1) add('moq', 'Minimum order must be a whole number of metres, 1 or more');
  if (!Number.isInteger(b.stock) || b.stock < 0) add('stock', 'Stock must be a whole number of metres, 0 or more');
  if (b.lowStockThreshold !== undefined && (!Number.isInteger(b.lowStockThreshold) || b.lowStockThreshold < 0)) add('lowStockThreshold', 'Low-stock alert must be a whole number, 0 or more');
  if (b.gstPercent !== undefined && b.gstPercent !== null && (!isNum(b.gstPercent) || b.gstPercent < 0 || b.gstPercent > 28)) add('gstPercent', 'GST must be between 0 and 28');
  if (b.hsnCode !== undefined && b.hsnCode !== '' && !/^\d{4,8}$/.test(b.hsnCode)) add('hsnCode', 'HSN code must be 4 to 8 digits');
  if (b.status !== undefined && !PRODUCT_STATUSES.includes(b.status)) add('status', 'Choose a status');
  for (const flag of ['isBestSeller', 'isNewArrival']) if (b[flag] !== undefined && typeof b[flag] !== 'boolean') add(flag, `${flag} must be true or false`);

  // bulk slabs: the first slab starts at the MOQ and later quantities increase
  if (b.bulkPricing !== undefined) {
    if (!Array.isArray(b.bulkPricing) || b.bulkPricing.length > 6) add('bulkPricing', 'Add up to 6 bulk price slabs');
    else {
      let prevQty = b.moq ?? 0;
      let prevPrice = b.price ?? Infinity;
      b.bulkPricing.forEach((s, i) => {
        if (!Number.isInteger(s?.minQty) || !isNum(s?.price) || s.price <= 0) { add(`bulkPricing.${i}`, `Slab ${i + 1}: enter a whole-metre quantity and a price`); return; }
        if (i > 0 && s.minQty <= prevQty) add(`bulkPricing.${i}`, `Slab ${i + 1}: quantity must be higher than ${prevQty} m`);
        if (s.price >= prevPrice) add(`bulkPricing.${i}`, `Slab ${i + 1}: price must be lower than ${prevPrice}`);
        prevQty = s.minQty; prevPrice = s.price;
      });
    }
  }
  if (b.colors !== undefined && (!Array.isArray(b.colors) || b.colors.length > 20 || b.colors.some((c) => !text(c?.name, 1, 40) || !HEX.test(c?.hex ?? '')))) add('colors', 'Each colour needs a name and a hex value like #1F4258 (up to 20)');
  if (b.images !== undefined && (!Array.isArray(b.images) || b.images.length > 8 || b.images.some((i) => typeof i?.url !== 'string' || !(/^(?:https?:\/\/|\/catalogue\/)[^\s]+$/i.test(i.url))))) add('images', 'Up to 8 images, each with a valid web address');
  if (b.specifications !== undefined && (!Array.isArray(b.specifications) || b.specifications.length > 20 || b.specifications.some((s) => !text(s?.label, 1, 60) || !text(s?.value, 1, 200)))) add('specifications', 'Each specification needs a label and a value (up to 20)');
  if (b.tags !== undefined && (!Array.isArray(b.tags) || b.tags.length > 15 || b.tags.some((t) => !text(t, 1, 30)))) add('tags', 'Up to 15 tags of 30 characters or fewer');
  return errors;
}

/** GET /api/admin/products query. */
export function validateAdminProductQuery(q) {
  const errors = [];
  if (q.status !== undefined && !PRODUCT_STATUSES.includes(q.status)) errors.push({ field: 'status', message: `status must be one of: ${PRODUCT_STATUSES.join(', ')}` });
  if (q.category !== undefined && !OBJECT_ID.test(q.category)) errors.push({ field: 'category', message: 'Invalid category' });
  for (const k of ['page', 'limit']) if (q[k] !== undefined && !(Number.isInteger(Number(q[k])) && Number(q[k]) >= 1)) errors.push({ field: k, message: `${k} must be a whole number of 1 or more` });
  return errors;
}
