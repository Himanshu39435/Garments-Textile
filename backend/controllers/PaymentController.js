import Order from '../models/OrderModel.js';
import Payment from '../models/PaymentModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { markOrderPaid } from '../services/OrderService.js';
import { createRazorpayOrderFor, toPaise, verifyCheckoutSignature, verifyWebhookSignature } from '../services/PaymentService.js';

async function findPayableOrder(req, orderId) {
  const order = /^[a-f\d]{24}$/i.test(orderId) ? await Order.findOne({ _id: orderId, user: req.user._id }) : null;
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentMethod !== 'razorpay') throw ApiError.badRequest('This order is not an online-payment order');
  return order;
}

/** POST /api/payments/razorpay/order { orderId }. Also used to retry payment on an unpaid order. */
export async function createRazorpayOrder(req, res, next) {
  try {
    const order = await findPayableOrder(req, req.body.orderId);
    if (order.paymentStatus === 'paid') throw ApiError.badRequest('This order is already paid');
    if (order.status === 'cancelled') throw ApiError.badRequest('This order was cancelled');
    return ApiResponse.ok(res, await createRazorpayOrderFor(order), 'Payment ready');
  } catch (error) { return next(error); }
}

/** POST /api/payments/razorpay/verify. The browser's "success" is never trusted: the signature must match. */
export async function verifyRazorpayPayment(req, res, next) {
  try {
    const { orderId, razorpay_order_id: rzpOrderId, razorpay_payment_id: rzpPaymentId, razorpay_signature: signature } = req.body;
    const order = await findPayableOrder(req, orderId);
    if (!order.razorpayOrderId || order.razorpayOrderId !== rzpOrderId) throw ApiError.badRequest('Payment does not match this order');
    if (!verifyCheckoutSignature(rzpOrderId, rzpPaymentId, signature)) {
      await Payment.updateOne({ order: order._id, razorpayOrderId: rzpOrderId, status: 'created' }, { $set: { status: 'failed' } });
      throw ApiError.badRequest('Payment verification failed. If money was deducted, contact us with your order number.');
    }
    await markOrderPaid(order, { razorpayPaymentId: rzpPaymentId, razorpaySignature: signature });
    return ApiResponse.ok(res, { orderId: order._id, paymentStatus: order.paymentStatus, status: order.status }, 'Payment successful');
  } catch (error) { return next(error); }
}

/**
 * POST /api/payments/razorpay/webhook. Confirms payments even when the buyer closed the tab after paying.
 * Needs the RAW body (see server.js) to check the signature. Answers 200 for events we do not act on, so Razorpay stops retrying.
 */
export async function razorpayWebhook(req, res, next) {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    if (!verifyWebhookSignature(raw, req.headers['x-razorpay-signature'])) return res.status(401).json({ success: false, message: 'Invalid signature' });

    const event = JSON.parse(raw);
    const payment = event?.payload?.payment?.entity;
    if (['payment.captured', 'order.paid'].includes(event.event) && payment?.order_id) {
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (order && payment.amount === toPaise(order.pricing.total)) await markOrderPaid(order, { razorpayPaymentId: payment.id });
    }
    return res.status(200).json({ success: true });
  } catch (error) { return next(error); }
}
