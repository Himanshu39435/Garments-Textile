import Address from '../models/AddressModel.js';
import Quotation from '../models/QuotationModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { cancelQuotation, convertQuotation, createQuotation, effectiveStatus, presentQuotation, statusFilter } from '../services/QuotationService.js';
import { sendQuotationEmail } from '../services/EmailService.js';

const ID = /^[a-f\d]{24}$/i;

async function findMine(req) {
  const quote = ID.test(req.params.id) ? await Quotation.findOne({ _id: req.params.id, user: req.user._id }) : null;
  if (!quote) throw ApiError.notFound('Quotation not found');
  return quote;
}

/** POST /api/quotations: request a quote. */
export async function requestQuotation(req, res, next) {
  try {
    const quote = await createQuotation(req.user, req.body);
    Promise.resolve(sendQuotationEmail({ to: req.user.email, name: req.user.name, quoteNumber: quote.quoteNumber, headline: 'We received your quote request', detail: 'Our team will review it and send you prices shortly.' })).catch((e) => console.warn(`Quote email failed: ${e.message}`));
    return ApiResponse.created(res, presentQuotation(quote), 'Quote requested');
  } catch (error) { return next(error); }
}

/** GET /api/quotations: my quotations, newest first. `status` may be requested, approved, expired, converted, rejected or cancelled. */
export async function listMyQuotations(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const filter = { user: req.user._id, ...(req.query.status ? statusFilter(req.query.status) : {}) };
    const [total, rows] = await Promise.all([
      Quotation.countDocuments(filter),
      Quotation.find(filter).select('quoteNumber status validUntil items.name items.quantity items.unit createdAt order').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return ApiResponse.ok(res, rows.map((q) => ({ ...q, status: effectiveStatus(q) })), 'Quotations fetched', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
}

/** GET /api/quotations/:id[?addressId=...]: with an address, totals include the CGST/SGST vs IGST split. */
export async function getMyQuotation(req, res, next) {
  try {
    const quote = await findMine(req);
    let shippingStateCode;
    if (req.query.addressId && ID.test(req.query.addressId)) shippingStateCode = (await Address.findOne({ _id: req.query.addressId, user: req.user._id }).select('stateCode').lean())?.stateCode;
    return ApiResponse.ok(res, presentQuotation(quote, { shippingStateCode }));
  } catch (error) { return next(error); }
}

/** POST /api/quotations/:id/cancel */
export async function cancelMyQuotation(req, res, next) {
  try {
    return ApiResponse.ok(res, presentQuotation(await cancelQuotation(await findMine(req))), 'Quotation cancelled');
  } catch (error) { return next(error); }
}

/** POST /api/quotations/:id/convert: place an order at the quoted prices. Same body as checkout. */
export async function convertMyQuotation(req, res, next) {
  try {
    const quote = await findMine(req);
    const order = await convertQuotation(quote, { user: req.user, ...req.body });
    const plain = order.toObject();
    return ApiResponse.created(res, plain, 'Order placed from your quotation');
  } catch (error) { return next(error); }
}
