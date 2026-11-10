import crypto from 'node:crypto';
import Payment from '../models/PaymentModel.js';
import ApiError from '../utils/ApiError.js';
import { getRazorpay } from '../config/razorpayConfig.js';

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
const safeEqualHex = (a, b) => {
  const x = Buffer.from(String(a), 'utf8');
  const y = Buffer.from(String(b), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const toPaise = (rupees) => Math.round(rupees * 100);

/** Creates (or reuses) the Razorpay order for an unpaid order and returns what the browser checkout needs. */
export async function createRazorpayOrderFor(order) {
  const amount = toPaise(order.pricing.total);
  if (!order.razorpayOrderId) {
    const rzpOrder = await getRazorpay().orders.create({ amount, currency: 'INR', receipt: order.orderNumber, notes: { orderId: String(order._id) } });
    order.razorpayOrderId = rzpOrder.id;
    await order.save();
    await Payment.create({ order: order._id, user: order.user, method: 'razorpay', amount: order.pricing.total, razorpayOrderId: rzpOrder.id });
  }
  return { keyId: process.env.RAZORPAY_KEY_ID, razorpayOrderId: order.razorpayOrderId, amount, currency: 'INR', orderNumber: order.orderNumber };
}

/** Razorpay Checkout signature: HMAC_SHA256(`${razorpay_order_id}|${razorpay_payment_id}`, key_secret). */
export function verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, signature) {
  if (!process.env.RAZORPAY_KEY_SECRET) throw ApiError.badRequest('Online payments are not configured');
  return safeEqualHex(hmac(process.env.RAZORPAY_KEY_SECRET, `${razorpayOrderId}|${razorpayPaymentId}`), signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return safeEqualHex(hmac(secret, rawBody), signature);
}
