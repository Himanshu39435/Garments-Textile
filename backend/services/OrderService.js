import Address from '../models/AddressModel.js';
import Cart from '../models/CartModel.js';
import { nextSequence } from '../models/CounterModel.js';
import Order from '../models/OrderModel.js';
import Payment from '../models/PaymentModel.js';
import Product from '../models/ProductModel.js';
import ApiError from '../utils/ApiError.js';
import { loadPricedCart } from './CartService.js';
import { ensureInvoiceNumber } from './InvoiceService.js';

const snapshotAddress = (a) => ({ fullName: a.fullName, companyName: a.companyName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, stateCode: a.stateCode, pincode: a.pincode });

/** Atomically takes stock for each line; if any line cannot be satisfied, puts back what was taken and fails. */
async function reserveStock(lines) {
  const taken = [];
  for (const line of lines) {
    const result = await Product.updateOne({ _id: line.productId, status: 'active', stock: { $gte: line.quantity } }, { $inc: { stock: -line.quantity } });
    if (result.modifiedCount !== 1) {
      await restoreStock(taken);
      throw ApiError.conflict(`${line.product.name} no longer has enough stock. Review your cart.`);
    }
    taken.push(line);
  }
  return taken;
}

async function restoreStock(lines) {
  await Promise.all(lines.map((l) => Product.updateOne({ _id: l.productId ?? l.product, }, { $inc: { stock: l.quantity } })));
}

/** Loads and checks the chosen addresses. Billing defaults to the delivery address. */
export async function loadCheckoutAddresses(user, shippingAddressId, billingAddressId) {
  const shipping = await Address.findOne({ _id: shippingAddressId, user: user._id });
  if (!shipping) throw ApiError.badRequest('Choose a valid delivery address');
  const billing = billingAddressId ? await Address.findOne({ _id: billingAddressId, user: user._id }) : shipping;
  if (!billing) throw ApiError.badRequest('Choose a valid billing address');
  return { shipping, billing };
}

/**
 * The one place orders are created, used by cart checkout and quotation conversion.
 * `lines`: [{ productId, product, quantity, unitPrice, lineSubtotal, gstPercent, gstAmount }]. Reserves stock atomically first,
 * and gives it back if anything after that fails. `extra` adds fields such as the quotation reference.
 */
export async function createOrderFromLines({ user, lines, totals, shipping, billing, paymentMethod, notes, extra = {} }) {
  const taken = await reserveStock(lines);
  try {
    const year = new Date().getFullYear();
    const seq = await nextSequence(`order-${year}`);
    const order = await Order.create({
      orderNumber: `NT-${year}-${String(seq).padStart(6, '0')}`,
      user: user._id,
      customer: { name: user.name, email: user.email, phone: user.phone, companyName: user.business?.companyName, gstin: user.business?.gstin },
      items: lines.map((l) => ({
        product: l.productId, name: l.product.name, slug: l.product.slug, sku: l.product.sku, unit: l.product.unit, hsnCode: l.product.hsnCode,
        image: l.product.images?.[0]?.url, swatch: l.product.swatch,
        quantity: l.quantity, unitPrice: l.unitPrice, lineSubtotal: l.lineSubtotal, gstPercent: l.gstPercent, gstAmount: l.gstAmount,
      })),
      shippingAddress: snapshotAddress(shipping),
      billingAddress: snapshotAddress(billing),
      pricing: { subtotal: totals.subtotal, shipping: totals.shipping, gst: totals.gst, total: totals.total, taxType: totals.taxType, cgst: totals.cgst, sgst: totals.sgst, igst: totals.igst },
      paymentMethod,
      paymentStatus: paymentMethod === 'bank_transfer' ? 'awaiting_transfer' : 'pending',
      notes: notes?.trim() || undefined,
      statusHistory: [{ status: 'pending', at: new Date(), note: extra.quoteNumber ? `Order placed from quotation ${extra.quoteNumber}` : 'Order placed' }],
      ...extra,
    });
    if (paymentMethod === 'bank_transfer') await Payment.create({ order: order._id, user: user._id, method: 'bank_transfer', amount: totals.total });
    return order;
  } catch (error) {
    await restoreStock(taken); // do not leave stock reserved for an order that was never created
    throw error;
  }
}

/** Turns the user's cart into an order. Everything is recomputed here: the client only chooses addresses and a payment method. */
export async function placeOrder(user, { shippingAddressId, billingAddressId, paymentMethod, notes }) {
  const { shipping, billing } = await loadCheckoutAddresses(user, shippingAddressId, billingAddressId);
  const { priced } = await loadPricedCart(user._id, { shippingStateCode: shipping.stateCode });
  if (priced.lines.length === 0) throw ApiError.badRequest('Your cart is empty');
  if (priced.hasIssues) throw ApiError.conflict('Some items in your cart changed. Review your cart before paying.');

  const order = await createOrderFromLines({ user, lines: priced.lines, totals: priced.totals, shipping, billing, paymentMethod, notes });
  await Cart.updateOne({ user: user._id }, { $set: { items: [] } });
  return order;
}

/** Cancels an unpaid order and returns its stock. Paid orders must be handled by an admin (refund flow). */
export async function cancelOrder(order) {
  if (order.status !== 'pending' || order.paymentStatus === 'paid') throw ApiError.badRequest('This order can no longer be cancelled online. Please contact us.');
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.statusHistory.push({ status: 'cancelled', at: new Date(), note: 'Cancelled by customer' });
  await order.save();
  await restoreStock(order.items);
  return order;
}

/** Idempotent: safe to call from both the browser verification and the webhook. */
export async function markOrderPaid(order, { razorpayPaymentId, razorpaySignature, reference, by } = {}) {
  if (order.paymentStatus === 'paid') return order;
  order.paymentStatus = 'paid';
  order.paidAt = new Date();
  if (order.status === 'pending') {
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', at: new Date(), note: reference ? `Payment received (ref ${reference})` : 'Payment received', by });
  } else if (order.status === 'cancelled') console.warn(`Payment received for cancelled order ${order.orderNumber}: refund required`);
  await order.save();
  await ensureInvoiceNumber(order);

  await Payment.updateOne(
    { order: order._id, razorpayOrderId: order.razorpayOrderId },
    { $set: { status: 'paid', paidAt: new Date(), ...(razorpayPaymentId && { razorpayPaymentId }), ...(razorpaySignature && { razorpaySignature }), ...(reference && { reference }) } },
  );
  return order;
}


/** What an admin may do next. Paid orders move forward one step at a time; any live order can be cancelled before it ships. */
export const STATUS_TRANSITIONS = { pending: ['cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

/** Admin status change. `shipment` is required when shipping. Cancelling returns stock; a paid order then needs a manual refund. */
export async function changeOrderStatus(order, { status, note, shipment, by }) {
  if (!STATUS_TRANSITIONS[order.status].includes(status)) {
    throw ApiError.badRequest(`An order that is ${order.status} cannot be changed to ${status}`);
  }
  const now = new Date();
  if (status === 'shipped') order.shipment = { ...(order.shipment?.toObject?.() ?? {}), ...shipment, shippedAt: now };
  if (status === 'delivered') order.shipment = { ...(order.shipment?.toObject?.() ?? {}), deliveredAt: now };
  if (status === 'cancelled') order.cancelledAt = now;

  const wasCancelled = status === 'cancelled';
  order.status = status;
  order.statusHistory.push({ status, at: now, note: note?.trim() || (wasCancelled && order.paymentStatus === 'paid' ? 'Cancelled by admin. Refund due' : 'Updated by admin'), by });
  await order.save();
  if (wasCancelled) await restoreStock(order.items);
  return order;
}

/** Confirms a bank transfer that has reached the account. Razorpay orders confirm themselves. */
export async function confirmBankTransfer(order, { reference, by }) {
  if (order.paymentMethod !== 'bank_transfer') throw ApiError.badRequest('Only bank-transfer orders are confirmed by hand');
  if (order.status !== 'pending' || order.paymentStatus === 'paid') throw ApiError.badRequest('This order is not waiting for a transfer');
  return markOrderPaid(order, { reference, by });
}

/** Records that money for a cancelled, paid order has been returned. Does not call Razorpay: refund there first. */
export async function recordRefund(order, { reference, by }) {
  if (order.status !== 'cancelled' || order.paymentStatus !== 'paid') throw ApiError.badRequest('Only cancelled orders that were paid can be marked refunded');
  order.paymentStatus = 'refunded';
  order.statusHistory.push({ status: 'cancelled', at: new Date(), note: `Refund recorded${reference ? ` (ref ${reference})` : ''}`, by });
  await order.save();
  await Payment.updateMany({ order: order._id, status: 'paid' }, { $set: { status: 'refunded', ...(reference && { reference }) } });
  return order;
}
