import { GST_RATE_PERCENT } from '@/utils/constants';

const round2 = (n) => Math.round(n * 100) / 100;
const bySlabDesc = (a, b) => b.minQty - a.minQty;

/** Per-metre price for a quantity, applying the highest bulk slab reached. */
export function getUnitPrice(product, quantity) {
  const slab = [...(product.bulkPricing ?? [])].sort(bySlabDesc).find((s) => quantity >= s.minQty);
  return slab ? slab.price : product.price;
}

/** Lowest per-metre price across all slabs, or null when there are no bulk slabs. */
export function getLowestBulkPrice(product) {
  const prices = (product.bulkPricing ?? []).map((s) => s.price);
  return prices.length ? Math.min(...prices) : null;
}

/** Rows for the bulk price table: [{ from, to, price }]. `to` is null for the last open-ended slab. */
export function getBulkSlabRows(product) {
  const slabs = [...(product.bulkPricing ?? [])].sort((a, b) => a.minQty - b.minQty);
  const rows = [];
  const firstSlabStart = slabs[0]?.minQty;
  if (!firstSlabStart || product.moq < firstSlabStart) {
    rows.push({ from: product.moq, to: firstSlabStart ? firstSlabStart - 1 : null, price: product.price });
  }
  slabs.forEach((s, i) => rows.push({ from: s.minQty, to: slabs[i + 1] ? slabs[i + 1].minQty - 1 : null, price: s.price }));
  return rows;
}

/** Returns an error message, or null when the quantity can be ordered. */
export function getQuantityError(product, quantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Enter the quantity in metres';
  if (quantity < product.moq) return `Minimum order is ${product.moq} ${product.unit ?? 'm'}`;
  if (quantity > product.stock) return `Only ${product.stock} ${product.unit ?? 'm'} in stock`;
  return null;
}

/** Estimated subtotal, GST and total for a quantity (excludes shipping). The server recomputes every amount at checkout. */
export function calculateTotals(product, quantity, gstPercent = product.gstPercent ?? GST_RATE_PERCENT) {
  const unitPrice = getUnitPrice(product, quantity);
  const subtotal = round2(unitPrice * quantity);
  const gst = round2((subtotal * gstPercent) / 100);
  return { unitPrice, subtotal, gst, total: round2(subtotal + gst), gstPercent };
}
