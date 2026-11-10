import { getCommerceConfig } from '../config/commerceConfig.js';

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Per-metre price for `quantity`, applying the highest bulk slab reached. Mirrors frontend/src/utils/pricing.js. */
export function getUnitPrice(product, quantity) {
  const slab = [...(product.bulkPricing ?? [])].sort((a, b) => b.minQty - a.minQty).find((s) => quantity >= s.minQty);
  return slab ? slab.price : product.price;
}

/** Why a quantity cannot be ordered, or null when it can. */
export function getQuantityIssue(product, quantity) {
  if (!product || product.status !== 'active') return 'unavailable';
  if (quantity < product.moq) return 'below_moq';
  if (quantity > product.stock) return 'insufficient_stock';
  return null;
}

/** CGST + SGST when delivering in the seller's state, IGST elsewhere. No state yet means no split. */
export function taxBreakdown(gst, stateCode) {
  if (!stateCode) return { taxType: null, cgst: 0, sgst: 0, igst: 0 };
  if (stateCode === getCommerceConfig().sellerStateCode) {
    const cgst = round2(gst / 2);
    return { taxType: 'cgst_sgst', cgst, sgst: round2(gst - cgst), igst: 0 };
  }
  return { taxType: 'igst', cgst: 0, sgst: 0, igst: gst };
}

export function shippingFor(subtotal) {
  const { shippingFlatRate, freeShippingThreshold } = getCommerceConfig();
  if (subtotal <= 0 || subtotal >= freeShippingThreshold) return 0;
  return shippingFlatRate;
}

/**
 * Prices a cart. `entries` is [{ product, quantity, productId }] where product is a full product object (or null if deleted).
 * The result is the single source of truth for cart, checkout and orders: clients never send prices.
 * Shipping is not taxed here: confirm treatment with your accountant.
 */
export function priceCart(entries, { shippingStateCode } = {}) {
  const config = getCommerceConfig();
  const lines = entries.map(({ product, quantity, productId }) => {
    const issue = getQuantityIssue(product, quantity);
    const unitPrice = product ? getUnitPrice(product, quantity) : 0;
    const lineSubtotal = issue === 'unavailable' ? 0 : round2(unitPrice * quantity);
    const gstPercent = product?.gstPercent ?? config.defaultGstPercent;
    return { productId: productId ?? product?._id, product, quantity, unitPrice, lineSubtotal, gstPercent, gstAmount: round2((lineSubtotal * gstPercent) / 100), issue };
  });

  const payable = lines.filter((l) => l.issue !== 'unavailable');
  const subtotal = round2(payable.reduce((sum, l) => sum + l.lineSubtotal, 0));
  const gst = round2(payable.reduce((sum, l) => sum + l.gstAmount, 0));
  const shipping = shippingFor(subtotal);

  const { taxType, cgst, sgst, igst } = taxBreakdown(gst, shippingStateCode);

  return {
    lines,
    hasIssues: lines.some((l) => l.issue),
    totals: { subtotal, shipping, gst, total: round2(subtotal + gst + shipping), taxType, cgst, sgst, igst, freeShippingThreshold: config.freeShippingThreshold },
  };
}

/**
 * Prices a quotation. The discount is folded into each per-metre rate (rounded to paise) so order lines and invoices
 * show the rate the customer actually pays. Shipping is the fixed charge stored on the quote.
 */
export function priceQuotation(quote, { shippingStateCode } = {}) {
  const discount = quote.discountPercent ?? 0;
  const lines = quote.items.map((i) => {
    const unitPrice = round2((i.quotedPrice ?? i.listPrice) * (1 - discount / 100));
    const lineSubtotal = round2(unitPrice * i.quantity);
    return { ...i, unitPrice, lineSubtotal, gstAmount: round2((lineSubtotal * i.gstPercent) / 100), listTotal: round2(i.listPrice * i.quantity) };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.lineSubtotal, 0));
  const gst = round2(lines.reduce((s, l) => s + l.gstAmount, 0));
  const shipping = quote.shippingCharge ?? shippingFor(subtotal);
  return {
    lines,
    totals: {
      subtotal, shipping, gst, total: round2(subtotal + gst + shipping), discountPercent: discount,
      savings: round2(lines.reduce((s, l) => s + l.listTotal, 0) - subtotal),
      ...taxBreakdown(gst, shippingStateCode),
    },
  };
}
