import Product from '../models/ProductModel.js';
import Quotation from '../models/QuotationModel.js';
import { nextSequence } from '../models/CounterModel.js';
import ApiError from '../utils/ApiError.js';
import { getCommerceConfig } from '../config/commerceConfig.js';
import { createOrderFromLines, loadCheckoutAddresses } from './OrderService.js';
import { getUnitPrice, priceQuotation } from './PricingService.js';

/** A date such as "2026-12-31" means the whole of that day in India. */
export const endOfDayIST = (dateText) => new Date(`${dateText}T23:59:59.999+05:30`);

/** Stored status, except that an approved quote past its validity date is reported as expired. */
export function effectiveStatus(quote) {
  return quote.status === 'approved' && quote.validUntil && new Date(quote.validUntil) < new Date() ? 'expired' : quote.status;
}

const idOf = (item) => String(item.product);

/** Shape sent to clients. Customers never see admin ids; only approved or converted quotes carry prices. */
export function presentQuotation(quote, { forAdmin = false, shippingStateCode } = {}) {
  const { approvedBy, statusHistory, ...q } = quote.toObject ? quote.toObject() : quote;
  const status = effectiveStatus(q);
  const priced = ['approved', 'converted'].includes(q.status) ? priceQuotation(q, { shippingStateCode }) : null;
  const estimate = q.status === 'requested' ? priceQuotation(q, { shippingStateCode }).totals : null; // list-price guide only
  return {
    ...q,
    status,
    priced,
    estimate,
    ...(forAdmin ? { approvedBy, statusHistory } : { statusHistory: statusHistory?.map(({ by: _admin, ...h }) => h) }),
  };
}

/** Creates a quote request. Quantities must meet each product's minimum order, and prices are snapshotted for reference. */
export async function createQuotation(user, { items, notes, requiredBy }) {
  const merged = new Map();
  for (const { productId, quantity, requestedPrice } of items) {
    const row = merged.get(productId) ?? { quantity: 0 };
    merged.set(productId, { quantity: row.quantity + quantity, requestedPrice: requestedPrice ?? row.requestedPrice });
  }
  const products = await Product.find({ _id: { $in: [...merged.keys()] }, status: 'active' }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  for (const [productId, { quantity, requestedPrice }] of merged) {
    const p = byId.get(productId);
    if (!p) throw ApiError.badRequest('One of the fabrics is no longer available');
    if (quantity < p.moq) throw ApiError.badRequest(`Minimum order for ${p.name} is ${p.moq} ${p.unit}`);
    lines.push({ product: p._id, name: p.name, sku: p.sku, unit: p.unit, hsnCode: p.hsnCode, gstPercent: p.gstPercent ?? getCommerceConfig().defaultGstPercent, quantity, listPrice: getUnitPrice(p, quantity), requestedPrice });
  }

  const year = new Date().getFullYear();
  const seq = await nextSequence(`quote-${year}`);
  return Quotation.create({
    quoteNumber: `QT-${year}-${String(seq).padStart(6, '0')}`,
    user: user._id,
    customer: { name: user.name, email: user.email, phone: user.phone, companyName: user.business?.companyName, gstin: user.business?.gstin },
    items: lines,
    notes: notes?.trim() || undefined,
    requiredBy: requiredBy ? endOfDayIST(requiredBy) : undefined,
    statusHistory: [{ status: 'requested', at: new Date(), note: 'Quote requested' }],
  });
}

/** Admin sets prices and sends the quote. Also used to re-price a quote that is approved or has expired. */
export async function approveQuotation(quote, { items, discountPercent = 0, shippingCharge, validUntil, adminNote }, adminId) {
  if (!['requested', 'approved'].includes(quote.status)) throw ApiError.badRequest(`A ${quote.status} quotation cannot be approved`);
  const wanted = new Set(quote.items.map(idOf));
  if (items.length !== wanted.size || items.some((i) => !wanted.has(i.productId))) throw ApiError.badRequest('Give a price for every item on the request');

  const products = await Product.find({ _id: { $in: [...wanted] } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const byInput = new Map(items.map((i) => [i.productId, i]));
  for (const item of quote.items) {
    const p = byId.get(idOf(item));
    if (!p || p.status !== 'active') throw ApiError.conflict(`${item.name} is no longer available. Reject this request and ask for a new one.`);
    const input = byInput.get(idOf(item));
    item.quantity = input.quantity;
    item.quotedPrice = input.quotedPrice;
    item.listPrice = getUnitPrice(p, input.quantity);
    item.gstPercent = p.gstPercent ?? getCommerceConfig().defaultGstPercent;
    item.hsnCode = p.hsnCode;
  }
  quote.discountPercent = discountPercent;
  quote.shippingCharge = shippingCharge; // fixed now; undefined falls back to the standard shipping rule below
  quote.validUntil = endOfDayIST(validUntil);
  quote.adminNote = adminNote?.trim() || undefined;
  if (shippingCharge === undefined) quote.shippingCharge = priceQuotation(quote.toObject()).totals.shipping;
  quote.status = 'approved';
  quote.approvedAt = new Date();
  quote.approvedBy = adminId;
  quote.statusHistory.push({ status: 'approved', at: new Date(), note: `Quote sent, valid until ${validUntil}`, by: adminId });
  await quote.save();
  return quote;
}

export async function rejectQuotation(quote, reason, adminId) {
  if (!['requested', 'approved'].includes(quote.status)) throw ApiError.badRequest(`A ${quote.status} quotation cannot be rejected`);
  quote.status = 'rejected';
  quote.rejectionReason = reason?.trim() || undefined;
  quote.statusHistory.push({ status: 'rejected', at: new Date(), note: reason?.trim() || 'Rejected', by: adminId });
  await quote.save();
  return quote;
}

/** The customer withdraws a request or declines an approved quote. */
export async function cancelQuotation(quote) {
  if (!['requested', 'approved'].includes(quote.status)) throw ApiError.badRequest(`A ${quote.status} quotation cannot be cancelled`);
  quote.status = 'cancelled';
  quote.statusHistory.push({ status: 'cancelled', at: new Date(), note: 'Withdrawn by customer' });
  await quote.save();
  return quote;
}

/**
 * Places an order at the quoted prices. The quote is claimed first (approved to converted in one conditional update),
 * so two clicks or an admin and a customer at once can only ever produce one order. The claim is undone if the order fails.
 */
export async function convertQuotation(quote, { user, shippingAddressId, billingAddressId, paymentMethod, notes, by }) {
  const status = effectiveStatus(quote);
  if (status === 'expired') throw ApiError.conflict('This quotation has expired. Ask us for a new quote.');
  if (status !== 'approved') throw ApiError.badRequest(`A ${status} quotation cannot be ordered`);

  const { shipping, billing } = await loadCheckoutAddresses(user, shippingAddressId, billingAddressId);
  const products = await Product.find({ _id: { $in: quote.items.map((i) => i.product) } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const unavailable = quote.items.find((i) => byId.get(idOf(i))?.status !== 'active');
  if (unavailable) throw ApiError.conflict(`${unavailable.name} is no longer available`);

  const { lines, totals } = priceQuotation(quote.toObject(), { shippingStateCode: shipping.stateCode });
  const claim = await Quotation.updateOne({ _id: quote._id, status: 'approved' }, { $set: { status: 'converted', convertedAt: new Date() } });
  if (claim.modifiedCount !== 1) throw ApiError.conflict('This quotation has already been ordered');

  try {
    const order = await createOrderFromLines({
      user, shipping, billing, paymentMethod, totals, notes,
      lines: lines.map((l) => ({ productId: l.product, product: byId.get(String(l.product)), quantity: l.quantity, unitPrice: l.unitPrice, lineSubtotal: l.lineSubtotal, gstPercent: l.gstPercent, gstAmount: l.gstAmount })),
      extra: { quotation: quote._id, quoteNumber: quote.quoteNumber },
    });
    quote.status = 'converted';
    quote.order = order._id;
    quote.statusHistory.push({ status: 'converted', at: new Date(), note: `Order ${order.orderNumber} placed`, by });
    await quote.save();
    return order;
  } catch (error) {
    await Quotation.updateOne({ _id: quote._id }, { $set: { status: 'approved' }, $unset: { convertedAt: 1 } });
    throw error;
  }
}

/** Mongo filter for a status the way clients see it (approved and expired both live under stored status "approved"). */
export function statusFilter(status) {
  if (status === 'expired') return { status: 'approved', validUntil: { $lt: new Date() } };
  if (status === 'approved') return { status: 'approved', validUntil: { $gte: new Date() } };
  return { status };
}
