import Category from '../models/CategoryModel.js';
import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';
import Quotation from '../models/QuotationModel.js';
import User from '../models/UserModel.js';

const IST_MS = 330 * 60 * 1000; // India Standard Time offset: months are cut at midnight IST, not UTC
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // fixed list: locale short names vary ("Sept")
const pad = (n) => String(n).padStart(2, '0');
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const istParts = (date) => { const d = new Date(new Date(date).getTime() + IST_MS); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; };
const monthKey = (date) => { const { y, m } = istParts(date); return `${y}-${pad(m + 1)}`; };

/** The last `count` calendar months (IST) ending with the current one, oldest first. */
export function lastMonths(count, now = new Date()) {
  const { y, m } = istParts(now);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - (count - 1 - i), 1));
    return { key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`, label: `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`, start: new Date(d.getTime() - IST_MS) };
  });
}

const PAID = { paymentStatus: 'paid', status: { $ne: 'cancelled' } };
const percentChange = (current, previous) => (previous > 0 ? round2(((current - previous) / previous) * 100) : null);

/**
 * Everything the admin dashboard shows. "Revenue" is money collected: paid, non-cancelled orders including GST and shipping.
 * Detailed breakdowns cover the last 12 months and are computed in memory, which is fine for a few thousand orders per year.
 * For much larger volumes move this to database aggregation or the reports module (Phase 10).
 */
export async function buildDashboard(now = new Date()) {
  const months = lastMonths(12, now);
  const since = months[0].start;
  const thisMonthKey = months[11].key;
  const lastMonthKey = months[10].key;

  const [quotesToReview, paidOrders, allTimeRevenue, paidCount, statusCounts, awaitingTransfer, recent, customerCount, newCustomers, products, staffCount] = await Promise.all([
    Quotation.countDocuments({ status: 'requested' }),
    Order.find({ ...PAID, paidAt: { $gte: since } }).select('paidAt pricing.total items.product items.name items.sku items.quantity items.lineSubtotal').lean(),
    Order.aggregate([{ $match: PAID }, { $group: { _id: null, revenue: { $sum: '$pricing.total' } } }]),
    Order.countDocuments(PAID),
    Promise.all(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(async (s) => [s, await Order.countDocuments({ status: s })])),
    Order.find({ paymentStatus: 'awaiting_transfer', status: { $ne: 'cancelled' } }).select('pricing.total').lean(),
    Order.find({}).select('orderNumber status paymentStatus paymentMethod pricing.total customer.name customer.companyName createdAt').sort({ createdAt: -1 }).limit(8).lean(),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: months[11].start } }),
    Product.find({}).select('name slug sku stock lowStockThreshold status category').lean(),
    User.countDocuments({ role: 'staff', isActive: true }),
  ]);

  // monthly revenue and order counts
  const byMonth = new Map(months.map((mo) => [mo.key, { month: mo.label, revenue: 0, orders: 0 }]));
  for (const o of paidOrders) {
    const row = byMonth.get(monthKey(o.paidAt));
    if (row) { row.revenue += o.pricing.total; row.orders += 1; }
  }
  const monthly = [...byMonth.values()].map((r) => ({ ...r, revenue: round2(r.revenue) }));
  const thisMonth = byMonth.get(thisMonthKey);
  const lastMonth = byMonth.get(lastMonthKey);

  // top products and sales by category (taxable value of items, last 12 months)
  const productById = new Map(products.map((p) => [String(p._id), p]));
  const topMap = new Map();
  const categoryTotals = new Map();
  for (const o of paidOrders) {
    for (const i of o.items) {
      const row = topMap.get(i.sku) ?? { name: i.name, sku: i.sku, units: 0, revenue: 0 };
      row.units += i.quantity; row.revenue += i.lineSubtotal;
      topMap.set(i.sku, row);
      const cat = productById.get(String(i.product))?.category;
      if (cat) categoryTotals.set(String(cat), (categoryTotals.get(String(cat)) ?? 0) + i.lineSubtotal);
    }
  }
  const categories = await Category.find({ _id: { $in: [...categoryTotals.keys()] } }).select('name').lean();
  const categoryName = new Map(categories.map((c) => [String(c._id), c.name]));

  const active = products.filter((p) => p.status === 'active');
  const lowStock = active.filter((p) => p.stock <= (p.lowStockThreshold ?? 100)).sort((a, b) => a.stock - b.stock);

  return {
    totals: {
      revenue: round2(allTimeRevenue[0]?.revenue ?? 0),
      paidOrders: paidCount,
      orders: statusCounts.reduce((sum, [, n]) => sum + n, 0),
      customers: customerCount,
      staff: staffCount,
      newCustomersThisMonth: newCustomers,
      products: active.length,
      draftProducts: products.length - active.length,
    },
    thisMonth: { revenue: round2(thisMonth.revenue), orders: thisMonth.orders, revenueChangePercent: percentChange(thisMonth.revenue, lastMonth.revenue) },
    attention: {
      awaitingTransfer: { count: awaitingTransfer.length, amount: round2(awaitingTransfer.reduce((s, o) => s + o.pricing.total, 0)) },
      toProcess: Object.fromEntries(statusCounts).confirmed,
      quotesToReview,
      lowStock: lowStock.length,
      outOfStock: active.filter((p) => p.stock <= 0).length,
    },
    ordersByStatus: Object.fromEntries(statusCounts),
    monthlySales: monthly,
    topProducts: [...topMap.values()].sort((a, b) => b.units - a.units).slice(0, 5).map((r) => ({ ...r, revenue: round2(r.revenue) })),
    salesByCategory: [...categoryTotals.entries()].map(([id, total]) => ({ category: categoryName.get(id) ?? 'Other', revenue: round2(total) })).sort((a, b) => b.revenue - a.revenue),
    recentOrders: recent,
    lowStockProducts: lowStock.slice(0, 8).map(({ name, slug, sku, stock, lowStockThreshold }) => ({ name, slug, sku, stock, threshold: lowStockThreshold ?? 100 })),
    generatedAt: now,
  };
}
