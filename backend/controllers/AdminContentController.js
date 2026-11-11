import Coupon from '../models/CouponModel.js';
import Order from '../models/OrderModel.js';
import Payment from '../models/PaymentModel.js';
import Product from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';
import WebsiteSettings from '../models/WebsiteSettingsModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const SETTINGS_KEY = 'narang-textile';
const OBJECT_ID = /^[a-f\d]{24}$/i;
const COUPON_FIELDS = ['code', 'discountType', 'discountValue', 'maxDiscount', 'minimumOrder', 'expiresAt', 'isActive'];
const SETTINGS_FIELDS = [
  'brandName', 'logoUrl', 'email', 'phone', 'address', 'whatsapp', 'instagramUrl', 'facebookUrl', 'youtubeUrl',
  'shippingCharge', 'freeShippingAbove', 'legalBusinessName', 'gstin', 'state', 'gstRate', 'hsnCode',
  'returnPolicy', 'privacyPolicy', 'terms', 'banners',
];
const pick = (source, fields) => Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));

export async function listAdminPayments(req, res, next) {
  try {
    const { method, status } = req.query;
    const filter = {};
    if (method) filter.paymentMethod = method;
    if (status) filter.paymentStatus = status;
    const orders = await Order.find(filter)
      .select('orderNumber customer.name paymentMethod paymentStatus pricing.total createdAt')
      .sort({ createdAt: -1 }).limit(200).lean();
    const attempts = await Payment.find({ order: { $in: orders.map((o) => o._id) } })
      .select('order razorpayPaymentId razorpayOrderId reference').sort({ createdAt: -1 }).lean();
    const latestByOrder = new Map();
    for (const attempt of attempts) if (!latestByOrder.has(String(attempt.order))) latestByOrder.set(String(attempt.order), attempt);
    const rows = orders.map((order) => {
      const attempt = latestByOrder.get(String(order._id));
      return {
        ...order,
        transactionId: attempt?.razorpayPaymentId || attempt?.reference || attempt?.razorpayOrderId || '',
      };
    });
    return ApiResponse.ok(res, rows, 'Payments fetched');
  } catch (error) { return next(error); }
}

export async function listCoupons(_req, res, next) {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return ApiResponse.ok(res, coupons, 'Coupons fetched');
  } catch (error) { return next(error); }
}

export async function createCoupon(req, res, next) {
  try {
    const coupon = await Coupon.create({
      ...pick(req.body, COUPON_FIELDS),
      code: req.body.code.trim().toUpperCase(),
      expiresAt: req.body.expiresAt || undefined,
      maxDiscount: req.body.maxDiscount === '' ? undefined : req.body.maxDiscount,
      used: 0,
    });
    return ApiResponse.created(res, coupon, 'Coupon created');
  } catch (error) {
    if (error.code === 11000) return next(ApiError.conflict('A coupon with this code already exists'));
    return next(error);
  }
}

export async function updateCoupon(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) throw ApiError.notFound('Coupon not found');
    const update = {
      ...pick(req.body, COUPON_FIELDS),
      code: req.body.code.trim().toUpperCase(),
    };
    const unset = {};
    if (req.body.expiresAt) update.expiresAt = req.body.expiresAt;
    else if (Object.hasOwn(req.body, 'expiresAt')) { delete update.expiresAt; unset.expiresAt = 1; }
    if (req.body.maxDiscount === '' || req.body.maxDiscount === null) { delete update.maxDiscount; unset.maxDiscount = 1; }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: update, ...(Object.keys(unset).length && { $unset: unset }) }, { new: true, runValidators: true });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return ApiResponse.ok(res, coupon, 'Coupon updated');
  } catch (error) {
    if (error.code === 11000) return next(ApiError.conflict('A coupon with this code already exists'));
    return next(error);
  }
}

export async function deleteCoupon(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.id)) throw ApiError.notFound('Coupon not found');
    const result = await Coupon.findByIdAndDelete(req.params.id);
    if (!result) throw ApiError.notFound('Coupon not found');
    return ApiResponse.ok(res, { id: req.params.id }, 'Coupon deleted');
  } catch (error) { return next(error); }
}

const DEFAULT_SETTINGS = {
  key: SETTINGS_KEY, brandName: 'NARANG TEXTILE', logoUrl: '', email: '', phone: '', address: '', whatsapp: '',
  instagramUrl: '', facebookUrl: '', youtubeUrl: '', shippingCharge: 500, freeShippingAbove: 50000,
  legalBusinessName: '', gstin: '', state: '', gstRate: 5, hsnCode: '', returnPolicy: '', privacyPolicy: '', terms: '', banners: [],
};

export async function getWebsiteSettings(_req, res, next) {
  try {
    const settings = await WebsiteSettings.findOneAndUpdate(
      { key: SETTINGS_KEY }, { $setOnInsert: DEFAULT_SETTINGS }, { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    return ApiResponse.ok(res, settings, 'Website settings fetched');
  } catch (error) { return next(error); }
}

export async function saveWebsiteSettings(req, res, next) {
  try {
    const settings = await WebsiteSettings.findOneAndUpdate(
      { key: SETTINGS_KEY }, { $set: pick(req.body, SETTINGS_FIELDS), $setOnInsert: { key: SETTINGS_KEY } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return ApiResponse.ok(res, settings, 'Website settings saved');
  } catch (error) { return next(error); }
}

function reportBucket(date, groupBy) {
  const day = new Date(date);
  const keyDay = day.toISOString().slice(0, 10);
  if (groupBy === 'monthly') return keyDay.slice(0, 7);
  if (groupBy === 'weekly') {
    const monday = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
  }
  return keyDay;
}

export async function getSalesReport(req, res, next) {
  try {
    const { from, to } = req.query;
    const groupBy = req.query.groupBy || 'daily';
    const match = { paymentStatus: 'paid', status: { $ne: 'cancelled' } };
    if (from || to) {
      match.paidAt = {
        ...(from && { $gte: new Date(`${from}T00:00:00+05:30`) }),
        ...(to && { $lte: new Date(`${to}T23:59:59.999+05:30`) }),
      };
    }
    const orders = await Order.find(match)
      .select('orderNumber paymentMethod paidAt pricing.total items.product items.name items.sku items.quantity items.lineSubtotal')
      .sort({ paidAt: 1 }).lean();
    const productIds = [...new Set(orders.flatMap((order) => order.items.map((item) => String(item.product))))];
    const products = await Product.find({ _id: { $in: productIds } }).select('category').lean();
    const categoryIds = [...new Set(products.map((product) => String(product.category)))];
    const categories = await Category.find({ _id: { $in: categoryIds } }).select('name').lean();
    const categoryById = new Map(categories.map((category) => [String(category._id), category.name]));
    const productById = new Map(products.map((product) => [String(product._id), String(product.category)]));
    const buckets = new Map();
    const productsBySku = new Map();
    const categoriesByName = new Map();
    const methods = new Map();
    let revenue = 0;

    for (const order of orders) {
      revenue += order.pricing.total;
      const key = reportBucket(order.paidAt, groupBy);
      const bucket = buckets.get(key) ?? { period: key, revenue: 0, orders: 0 };
      bucket.revenue += order.pricing.total;
      bucket.orders += 1;
      buckets.set(key, bucket);
      methods.set(order.paymentMethod, (methods.get(order.paymentMethod) ?? 0) + 1);
      for (const item of order.items) {
        const product = productsBySku.get(item.sku) ?? { sku: item.sku, name: item.name, units: 0, revenue: 0 };
        product.units += item.quantity;
        product.revenue += item.lineSubtotal;
        productsBySku.set(item.sku, product);
        const categoryId = productById.get(String(item.product));
        const name = categoryById.get(categoryId) ?? 'Other';
        categoriesByName.set(name, (categoriesByName.get(name) ?? 0) + item.lineSubtotal);
      }
    }
    const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
    return ApiResponse.ok(res, {
      totalRevenue: round2(revenue),
      totalOrders: orders.length,
      sales: [...buckets.values()].map((item) => ({ ...item, revenue: round2(item.revenue) })),
      products: [...productsBySku.values()].map((item) => ({ ...item, revenue: round2(item.revenue) })).sort((a, b) => b.revenue - a.revenue),
      categories: [...categoriesByName].map(([category, amount]) => ({ category, revenue: round2(amount) })).sort((a, b) => b.revenue - a.revenue),
      paymentMethods: [...methods].map(([method, count]) => ({ method, orders: count })),
      groupBy,
    }, 'Sales report fetched');
  } catch (error) { return next(error); }
}
