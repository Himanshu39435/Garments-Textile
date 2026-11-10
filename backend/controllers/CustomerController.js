import User from '../models/UserModel.js';
import Order from '../models/OrderModel.js';
import Quotation from '../models/QuotationModel.js';
import { effectiveStatus } from '../services/QuotationService.js';
import Product, { getStockStatus } from '../models/ProductModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

/** PUT /api/customer/profile. Updates personal and business details for the signed-in customer. */
export async function updateProfile(req, res, next) {
  try {
    const { name, phone, companyName, gstin, businessType } = req.body;
    const user = await User.findById(req.user._id);

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
    if (companyName !== undefined) user.business.companyName = companyName.trim() || undefined;
    if (gstin !== undefined) user.business.gstin = gstin.trim().toUpperCase() || undefined;
    if (businessType !== undefined) user.business.businessType = businessType.trim() || undefined;

    await user.save();
    return ApiResponse.ok(res, { user: user.toPublic() }, 'Profile updated');
  } catch (error) {
    return next(error);
  }
}

const OPEN_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'];

/** GET /api/customer/dashboard: this customer's orders and quotations, for the dashboard home. */
export async function getDashboardSummary(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id }).select('orderNumber status paymentStatus pricing.total createdAt items.name').sort({ createdAt: -1 }).lean();
    const live = orders.filter((o) => o.status !== 'cancelled');
    const quotes = (await Quotation.find({ user: req.user._id }).select('quoteNumber status validUntil items.name createdAt').sort({ createdAt: -1 }).lean()).map((q) => ({ ...q, status: effectiveStatus(q) }));
    return ApiResponse.ok(res, {
      totalOrders: orders.length,
      openOrders: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
      awaitingPayment: live.filter((o) => ['pending', 'awaiting_transfer'].includes(o.paymentStatus)).length,
      totalSpent: Math.round(orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.pricing.total, 0) * 100) / 100,
      wishlistCount: req.user.wishlist?.length ?? 0,
      recentOrders: orders.slice(0, 3),
      quotations: { total: quotes.length, awaitingReply: quotes.filter((q) => q.status === 'requested').length, readyToOrder: quotes.filter((q) => q.status === 'approved').length, recent: quotes.slice(0, 3) },
    });
  } catch (error) { return next(error); }
}

const LIST_FIELDS = 'name slug sku category fabricType composition gsm width colors images swatch price bulkPricing unit moq stock gstPercent lowStockThreshold isBestSeller isNewArrival';
const OBJECT_ID = /^[a-f\d]{24}$/i;

/** GET /api/customer/wishlist: { ids, products } where products are active items only. */
export async function getWishlist(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('wishlist').lean();
    const products = await Product.find({ _id: { $in: user.wishlist }, status: 'active' }).select(LIST_FIELDS).populate('category', 'name slug').lean();
    const order = new Map(user.wishlist.map((id, i) => [String(id), i]));
    products.sort((a, b) => order.get(String(b._id)) - order.get(String(a._id))); // newest saved first
    return ApiResponse.ok(res, { ids: user.wishlist.map(String), products: products.map((p) => ({ ...p, stockStatus: getStockStatus(p) })) });
  } catch (error) { return next(error); }
}

/** POST /api/customer/wishlist/:productId (idempotent) */
export async function addToWishlist(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.productId) || !(await Product.exists({ _id: req.params.productId, status: 'active' }))) throw ApiError.notFound('This fabric is no longer available');
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: req.params.productId } });
    const user = await User.findById(req.user._id).select('wishlist').lean();
    return ApiResponse.ok(res, { ids: user.wishlist.map(String) }, 'Saved to wishlist');
  } catch (error) { return next(error); }
}

/** DELETE /api/customer/wishlist/:productId */
export async function removeFromWishlist(req, res, next) {
  try {
    if (!OBJECT_ID.test(req.params.productId)) throw ApiError.notFound('Not found');
    await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
    const user = await User.findById(req.user._id).select('wishlist').lean();
    return ApiResponse.ok(res, { ids: user.wishlist.map(String) }, 'Removed from wishlist');
  } catch (error) { return next(error); }
}
