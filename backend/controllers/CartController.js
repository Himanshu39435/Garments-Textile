import Address from '../models/AddressModel.js';
import Product from '../models/ProductModel.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getOrCreateCart, loadPricedCart, serializeCart } from '../services/CartService.js';
import { getQuantityIssue } from '../services/PricingService.js';

const ISSUE_MESSAGE = {
  unavailable: () => 'This fabric is no longer available',
  below_moq: (p) => `Minimum order for ${p.name} is ${p.moq} ${p.unit}`,
  insufficient_stock: (p) => `Only ${p.stock} ${p.unit} of ${p.name} in stock`,
};

async function respond(res, userId, message, shippingStateCode) {
  return ApiResponse.ok(res, serializeCart(await loadPricedCart(userId, { shippingStateCode })), message);
}

function assertOrderable(product, quantity) {
  const issue = getQuantityIssue(product, quantity);
  if (issue) throw ApiError.badRequest(ISSUE_MESSAGE[issue](product));
}

/** GET /api/cart[?addressId=...]. With an address, totals include the CGST/SGST vs IGST split. */
export async function getCart(req, res, next) {
  try {
    let shippingStateCode;
    if (req.query.addressId) {
      const address = await Address.findOne({ _id: req.query.addressId, user: req.user._id }).select('stateCode').lean();
      shippingStateCode = address?.stateCode;
    }
    return await respond(res, req.user._id, 'Cart fetched', shippingStateCode);
  } catch (error) { return next(error); }
}

/** POST /api/cart/items. Adds to any quantity already in the cart. */
export async function addItem(req, res, next) {
  try {
    const product = await Product.findOne({ _id: req.body.productId, status: 'active' }).lean();
    if (!product) throw ApiError.notFound('This fabric is no longer available');

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find((i) => String(i.product) === String(product._id));
    const quantity = (existing?.quantity ?? 0) + req.body.quantity;
    assertOrderable(product, quantity);

    if (existing) existing.quantity = quantity;
    else cart.items.push({ product: product._id, quantity });
    await cart.save();
    return await respond(res, req.user._id, 'Added to cart');
  } catch (error) { return next(error); }
}

/** PUT /api/cart/items/:productId. Sets the quantity. */
export async function updateItem(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((i) => String(i.product) === req.params.productId);
    if (!item) throw ApiError.notFound('That item is not in your cart');
    const product = await Product.findById(item.product).lean();
    assertOrderable(product, req.body.quantity);
    item.quantity = req.body.quantity;
    await cart.save();
    return await respond(res, req.user._id, 'Cart updated');
  } catch (error) { return next(error); }
}

/** DELETE /api/cart/items/:productId */
export async function removeItem(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
    await cart.save();
    return await respond(res, req.user._id, 'Removed from cart');
  } catch (error) { return next(error); }
}

/** DELETE /api/cart */
export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    return await respond(res, req.user._id, 'Cart cleared');
  } catch (error) { return next(error); }
}
