import Cart from '../models/CartModel.js';
import Product from '../models/ProductModel.js';
import { priceCart } from './PricingService.js';

export async function getOrCreateCart(userId) {
  return (await Cart.findOne({ user: userId })) ?? Cart.create({ user: userId, items: [] });
}

/** Loads the user's cart with live product data and prices it. Returns the cart document and the priced result. */
export async function loadPricedCart(userId, { shippingStateCode } = {}) {
  const cart = await getOrCreateCart(userId);
  const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const entries = cart.items.map((i) => ({ productId: i.product, product: byId.get(String(i.product)) ?? null, quantity: i.quantity }));
  return { cart, priced: priceCart(entries, { shippingStateCode }) };
}

/** Shape sent to the browser. */
export function serializeCart({ priced }) {
  return {
    items: priced.lines.map((l) => ({
      productId: l.productId,
      slug: l.product?.slug, name: l.product?.name ?? 'Unavailable fabric', sku: l.product?.sku,
      image: l.product?.images?.[0]?.url ?? null, swatch: l.product?.swatch ?? null,
      unit: l.product?.unit ?? 'm', moq: l.product?.moq, stock: l.product?.stock ?? 0,
      quantity: l.quantity, basePrice: l.product?.price, unitPrice: l.unitPrice, lineSubtotal: l.lineSubtotal,
      gstPercent: l.gstPercent, issue: l.issue,
    })),
    itemCount: priced.lines.length,
    hasIssues: priced.hasIssues,
    totals: priced.totals,
  };
}
