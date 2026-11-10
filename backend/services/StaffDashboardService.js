import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';
import Quotation from '../models/QuotationModel.js';
import { lastMonths } from './DashboardService.js';

/**
 * Everything the staff dashboard shows: today's work queue, not the books.
 * It deliberately has no revenue, sales or profit figures; those stay on the admin dashboard.
 */
export async function buildStaffDashboard(user, now = new Date()) {
  const monthStart = lastMonths(1, now)[0].start; // midnight IST on the 1st
  const mine = { $elemMatch: { by: user._id, at: { $gte: monthStart } } };

  const [toProcess, processing, inTransit, awaitingPayment, quotesToReview, quotesWithCustomers, orderQueue, quoteQueue, products, myOrders, myQuotes] = await Promise.all([
    Order.countDocuments({ status: 'confirmed' }),
    Order.countDocuments({ status: 'processing' }),
    Order.countDocuments({ status: 'shipped' }),
    Order.countDocuments({ paymentStatus: 'awaiting_transfer', status: { $ne: 'cancelled' } }),
    Quotation.countDocuments({ status: 'requested' }),
    Quotation.countDocuments({ status: 'approved', validUntil: { $gte: now } }),
    Order.find({ status: { $in: ['confirmed', 'processing'] } }).select('orderNumber status customer.name customer.companyName items.quantity items.unit createdAt').sort({ createdAt: 1 }).limit(8).lean(),
    Quotation.find({ status: 'requested' }).select('quoteNumber customer.name customer.companyName items.name items.quantity items.unit requiredBy createdAt').sort({ createdAt: 1 }).limit(5).lean(),
    Product.find({ status: 'active' }).select('name slug sku stock lowStockThreshold').lean(),
    Order.countDocuments({ statusHistory: mine }),
    Quotation.countDocuments({ statusHistory: mine }),
  ]);

  const lowStock = products.filter((p) => p.stock <= (p.lowStockThreshold ?? 100)).sort((a, b) => a.stock - b.stock);
  return {
    staff: { name: user.name, designation: user.designation ?? null },
    attention: { toProcess, processing, inTransit, awaitingPayment, quotesToReview, quotesWithCustomers, lowStock: lowStock.length, outOfStock: products.filter((p) => p.stock <= 0).length },
    orderQueue: orderQueue.map((o) => ({ ...o, totalQuantity: o.items.reduce((s, i) => s + i.quantity, 0), unit: o.items[0]?.unit })),
    quoteQueue,
    lowStockProducts: lowStock.slice(0, 8).map(({ name, slug, sku, stock, lowStockThreshold }) => ({ name, slug, sku, stock, threshold: lowStockThreshold ?? 100 })),
    myMonth: { ordersHandled: myOrders, quotationsHandled: myQuotes },
    generatedAt: now,
  };
}
