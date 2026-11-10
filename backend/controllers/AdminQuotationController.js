import Address from '../models/AddressModel.js';
import Order from '../models/OrderModel.js';
import Quotation from '../models/QuotationModel.js';
import User from '../models/UserModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { approveQuotation, convertQuotation, effectiveStatus, presentQuotation, rejectQuotation, statusFilter } from '../services/QuotationService.js';
import { sendQuotationEmail } from '../services/EmailService.js';

const ID = /^[a-f\d]{24}$/i;
const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const money = (n) => `Rs ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function find(req) {
  const quote = ID.test(req.params.id) ? await Quotation.findById(req.params.id) : null;
  if (!quote) throw ApiError.notFound('Quotation not found');
  return quote;
}
const notify = (quote, headline, detail) =>
  Promise.resolve(sendQuotationEmail({ to: quote.customer.email, name: quote.customer.name, quoteNumber: quote.quoteNumber, headline, detail })).catch((e) => console.warn(`Quote email failed: ${e.message}`));

/** GET /api/admin/quotations: filter by status and search quote number or customer. */
export async function listQuotations(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const filter = req.query.status ? statusFilter(req.query.status) : {};
    if (req.query.search?.trim()) {
      const pattern = new RegExp(escapeRegex(req.query.search.trim().slice(0, 80)), 'i');
      filter.$or = [{ quoteNumber: pattern }, { 'customer.name': pattern }, { 'customer.email': pattern }, { 'customer.companyName': pattern }];
    }
    const [total, rows] = await Promise.all([
      Quotation.countDocuments(filter),
      Quotation.find(filter).select('quoteNumber status validUntil customer items.name items.quantity items.unit createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return ApiResponse.ok(res, rows.map((q) => ({ ...q, status: effectiveStatus(q) })), 'Quotations fetched', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
}

export async function getQuotation(req, res, next) {
  try {
    const quote = await find(req);
    const order = quote.order ? await Order.findById(quote.order).select('orderNumber status paymentStatus').lean() : null;
    const defaultAddress = await Address.findOne({ user: quote.user }).sort({ isDefault: -1, createdAt: -1 }).select('stateCode state city').lean();
    return ApiResponse.ok(res, { ...presentQuotation(quote, { forAdmin: true, shippingStateCode: defaultAddress?.stateCode }), orderSummary: order, customerHasAddress: Boolean(defaultAddress) });
  } catch (error) { return next(error); }
}

/** PUT /api/admin/quotations/:id/approve: prices, discount, shipping and validity. Emails the customer. */
export async function approve(req, res, next) {
  try {
    const quote = await approveQuotation(await find(req), req.body, req.user._id);
    const total = presentQuotation(quote).priced.totals.total;
    notify(quote, 'Your quotation is ready', `Total ${money(total)} including GST and shipping, valid until ${req.body.validUntil}.${quote.adminNote ? `\n\n${quote.adminNote}` : ''}`);
    return ApiResponse.ok(res, presentQuotation(quote, { forAdmin: true }), 'Quotation approved and sent');
  } catch (error) { return next(error); }
}

export async function reject(req, res, next) {
  try {
    const quote = await rejectQuotation(await find(req), req.body.reason, req.user._id);
    notify(quote, 'About your quote request', quote.rejectionReason ?? 'We are unable to quote this request. Please contact us to discuss alternatives.');
    return ApiResponse.ok(res, presentQuotation(quote, { forAdmin: true }), 'Quotation rejected');
  } catch (error) { return next(error); }
}

/**
 * POST /api/admin/quotations/:id/convert: for a customer who agreed by phone. Uses their default address and bank transfer,
 * so the order waits for payment like any other bank-transfer order.
 */
export async function convert(req, res, next) {
  try {
    const quote = await find(req);
    const customer = await User.findById(quote.user);
    const address = await Address.findOne({ user: quote.user }).sort({ isDefault: -1, createdAt: -1 });
    if (!customer || !address) throw ApiError.badRequest('This customer has no saved address yet. Ask them to add one, or let them place the order themselves.');
    const order = await convertQuotation(quote, { user: customer, shippingAddressId: String(address._id), paymentMethod: 'bank_transfer', notes: 'Placed by our team at your request', by: req.user._id });
    notify(quote, 'We placed your order', `Order ${order.orderNumber} was created from your quotation. Pay by bank transfer using the order number as reference.`);
    return ApiResponse.created(res, { order: order.toObject(), quotation: presentQuotation(quote, { forAdmin: true }) }, 'Order created from quotation');
  } catch (error) { return next(error); }
}
