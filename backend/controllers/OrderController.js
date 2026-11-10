import Order, { ORDER_STATUSES } from '../models/OrderModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getCommerceConfig } from '../config/commerceConfig.js';
import { cancelOrder, placeOrder } from '../services/OrderService.js';
import { ensureInvoiceNumber, writeInvoicePdf } from '../services/InvoiceService.js';

const present = (order) => {
  const plain = order.toObject ? order.toObject() : order;
  plain.statusHistory = plain.statusHistory?.map(({ by: _admin, ...entry }) => entry); // never expose which admin made a change
  return plain.paymentMethod === 'bank_transfer' ? { ...plain, bankDetails: getCommerceConfig().bankDetails } : plain;
};

async function findMine(req) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw ApiError.notFound('Order not found');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

/** POST /api/orders: checkout. */
export async function createOrder(req, res, next) {
  try {
    const order = await placeOrder(req.user, req.body);
    return ApiResponse.created(res, present(order), 'Order placed');
  } catch (error) { return next(error); }
}

/** GET /api/orders: the signed-in customer's orders, newest first. */
export async function listMyOrders(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const filter = { user: req.user._id };
    if (req.query.status !== undefined) {
      if (!ORDER_STATUSES.includes(req.query.status)) throw ApiError.badRequest(`status must be one of: ${ORDER_STATUSES.join(', ')}`);
      filter.status = req.query.status;
    }
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter).select('orderNumber status paymentStatus paymentMethod invoiceNumber pricing.total items.name items.quantity items.unit createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return ApiResponse.ok(res, orders, 'Orders fetched', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
}

export async function getMyOrder(req, res, next) {
  try { return ApiResponse.ok(res, present(await findMine(req))); } catch (error) { return next(error); }
}

export async function cancelMyOrder(req, res, next) {
  try { return ApiResponse.ok(res, present(await cancelOrder(await findMine(req))), 'Order cancelled'); } catch (error) { return next(error); }
}

/** GET /api/orders/:id/invoice: GST tax invoice PDF. Only for paid orders. */
export async function downloadInvoice(req, res, next) {
  try {
    const order = await findMine(req);
    if (order.paymentStatus !== 'paid') throw ApiError.badRequest('An invoice is available once the order is paid');
    await ensureInvoiceNumber(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.invoiceNumber.replace(/\//g, '-')}.pdf"`);
    return writeInvoicePdf(order, res);
  } catch (error) { return next(error); }
}
