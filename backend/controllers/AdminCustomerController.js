import Address from '../models/AddressModel.js';
import Order from '../models/OrderModel.js';
import User from '../models/UserModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const ID = /^[a-f\d]{24}$/i;
const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const publicFields = (u) => ({ _id: u._id, name: u.name, email: u.email, phone: u.phone, business: u.business, isActive: u.isActive, isEmailVerified: u.isEmailVerified, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt });
const spentOf = (orders) => round2(orders.filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled').reduce((s, o) => s + o.pricing.total, 0));

/** GET /api/admin/customers: customers only (never admins), with order count and total paid. */
export async function listCustomers(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const filter = { role: 'customer' };
    if (req.query.search?.trim()) {
      const pattern = new RegExp(escapeRegex(req.query.search.trim().slice(0, 80)), 'i');
      filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }, { 'business.companyName': pattern }, { 'business.gstin': pattern }];
    }
    const [total, users] = await Promise.all([User.countDocuments(filter), User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean()]);
    const orders = await Order.find({ user: { $in: users.map((u) => u._id) } }).select('user pricing.total paymentStatus status').lean();
    const byUser = new Map();
    for (const o of orders) byUser.set(String(o.user), [...(byUser.get(String(o.user)) ?? []), o]);
    const rows = users.map((u) => ({ ...publicFields(u), orderCount: (byUser.get(String(u._id)) ?? []).length, totalPaid: spentOf(byUser.get(String(u._id)) ?? []) }));
    return ApiResponse.ok(res, rows, 'Customers fetched', { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { return next(error); }
}

/** GET /api/admin/customers/:id: profile, company and GST details, addresses and order history. */
export async function getCustomer(req, res, next) {
  try {
    const user = ID.test(req.params.id) ? await User.findOne({ _id: req.params.id, role: 'customer' }).lean() : null;
    if (!user) throw ApiError.notFound('Customer not found');
    const [addresses, orders] = await Promise.all([
      Address.find({ user: user._id }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      Order.find({ user: user._id }).select('orderNumber status paymentStatus paymentMethod pricing.total createdAt').sort({ createdAt: -1 }).lean(),
    ]);
    return ApiResponse.ok(res, { ...publicFields(user), addresses, orders, stats: { orderCount: orders.length, totalPaid: spentOf(orders) } });
  } catch (error) { return next(error); }
}

/** PUT /api/admin/customers/:id/status. A deactivated customer is signed out on their next request and cannot log in. */
export async function setCustomerStatus(req, res, next) {
  try {
    const user = ID.test(req.params.id) ? await User.findOne({ _id: req.params.id, role: 'customer' }) : null;
    if (!user) throw ApiError.notFound('Customer not found');
    user.isActive = req.body.isActive;
    await user.save();
    return ApiResponse.ok(res, publicFields(user), user.isActive ? 'Customer reactivated' : 'Customer deactivated');
  } catch (error) { return next(error); }
}
