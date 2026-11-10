import Order from '../models/OrderModel.js';
import Payment from '../models/PaymentModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { changeOrderStatus, confirmBankTransfer, recordRefund, STATUS_TRANSITIONS } from '../services/OrderService.js';
import { ensureInvoiceNumber, writeInvoicePdf } from '../services/InvoiceService.js';
import { sendOrderUpdateEmail } from '../services/EmailService.js';

const ID = /^[a-f\d]{24}$/i;
const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function find(req) {
  const order = ID.test(req.params.id) ? await Order.findById(req.params.id) : null;
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}
const present = (order) => ({ ...order.toObject(), allowedStatuses: STATUS_TRANSITIONS[order.status] });

/** Customer emails must never block or fail an admin action. */
function notify(order, headline, detail) {
  Promise.resolve(sendOrderUpdateEmail({ to: order.customer.email, name: order.customer.name, orderNumber: order.orderNumber, headline, detail }))
    .catch((e) => console.warn(`Order email failed for ${order.orderNumber}: ${e.message}`));
}

/** GET /api/admin/orders: filter by status, payment, method, date range and a search on order number or customer. */
export async function listOrders(req, res, next) {
  try {
    const { status, paymentStatus, paymentMethod, search, from, to } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (from || to) filter.createdAt = { ...(from && { $gte: new Date(`${from}T00:00:00+05:30`) }), ...(to && { $lte: new Date(`${to}T23:59:59.999+05:30`) }) }; // IST day boundaries
    if (search?.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim().slice(0, 80)), 'i');
      filter.$or = [{ orderNumber: pattern }, { 'customer.name': pattern }, { 'customer.email': pattern }, { 'customer.companyName': pattern }];
    }
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter).select('orderNumber status paymentStatus paymentMethod pricing.total customer user invoiceNumber createdAt items.quantity').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return ApiResponse.ok(res, orders, 'Orders fetched', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
}

/** GET /api/admin/orders/:id: the full order plus its payment attempts and the statuses an admin may move it to. */
export async function getOrder(req, res, next) {
  try {
    const order = await find(req);
    const payments = await Payment.find({ order: order._id }).sort({ createdAt: -1 }).lean();
    return ApiResponse.ok(res, { ...present(order), payments });
  } catch (error) { return next(error); }
}

/** PUT /api/admin/orders/:id/status */
export async function updateStatus(req, res, next) {
  try {
    const order = await find(req);
    const { status, note, courier, trackingNumber, trackingUrl } = req.body;
    if (status === 'cancelled' && req.user.role !== 'admin') throw ApiError.forbidden('Only an admin can cancel an order. Ask your admin to cancel it.');
    await changeOrderStatus(order, { status, note, by: req.user._id, shipment: status === 'shipped' ? { courier: courier.trim(), trackingNumber: trackingNumber?.trim() || undefined, trackingUrl: trackingUrl?.trim() || undefined } : undefined });
    const copy = { shipped: ['Your order has shipped', `Courier: ${order.shipment?.courier}${order.shipment?.trackingNumber ? `, tracking ${order.shipment.trackingNumber}` : ''}`], delivered: ['Your order was delivered', ''], cancelled: ['Your order was cancelled', note?.trim() ?? ''], processing: ['We are preparing your order', ''] }[status];
    if (copy) notify(order, ...copy);
    return ApiResponse.ok(res, present(order), 'Order updated');
  } catch (error) { return next(error); }
}

/** PUT /api/admin/orders/:id/shipment: fix courier details after the order has shipped. */
export async function updateShipment(req, res, next) {
  try {
    const order = await find(req);
    if (!['shipped', 'delivered'].includes(order.status)) throw ApiError.badRequest('Shipping details can be edited once the order has shipped');
    const { courier, trackingNumber, trackingUrl } = req.body;
    order.shipment = { ...order.shipment.toObject(), courier: courier.trim(), trackingNumber: trackingNumber?.trim() || undefined, trackingUrl: trackingUrl?.trim() || undefined };
    await order.save();
    return ApiResponse.ok(res, present(order), 'Shipping details updated');
  } catch (error) { return next(error); }
}

/** POST /api/admin/orders/:id/mark-paid: confirm a bank transfer. */
export async function markPaid(req, res, next) {
  try {
    const order = await find(req);
    await confirmBankTransfer(order, { reference: req.body.reference?.trim() || undefined, by: req.user._id });
    notify(order, 'We received your payment', 'Your order is confirmed and will be prepared shortly.');
    return ApiResponse.ok(res, present(order), 'Payment recorded and order confirmed');
  } catch (error) { return next(error); }
}

/** POST /api/admin/orders/:id/mark-refunded: record a refund you have already paid out. */
export async function markRefunded(req, res, next) {
  try {
    const order = await find(req);
    await recordRefund(order, { reference: req.body.reference?.trim() || undefined, by: req.user._id });
    return ApiResponse.ok(res, present(order), 'Refund recorded');
  } catch (error) { return next(error); }
}

/** GET /api/admin/orders/:id/invoice */
export async function downloadInvoice(req, res, next) {
  try {
    const order = await find(req);
    if (order.paymentStatus !== 'paid') throw ApiError.badRequest('An invoice is available once the order is paid');
    await ensureInvoiceNumber(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.invoiceNumber.replace(/\//g, '-')}.pdf"`);
    return writeInvoicePdf(order, res);
  } catch (error) { return next(error); }
}
