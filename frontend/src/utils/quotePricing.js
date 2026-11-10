const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Live preview for the admin pricing form. It mirrors the server's rules (the discount is folded into each per-metre rate,
 * GST is per line) but the server's figures are what the customer is charged. `shippingCharge` may be undefined.
 */
export function previewQuote(lines, discountPercent = 0, shippingCharge) {
  const rows = lines.map((l) => {
    const unitPrice = round2((Number(l.quotedPrice) || 0) * (1 - (discountPercent || 0) / 100));
    const lineSubtotal = round2(unitPrice * (Number(l.quantity) || 0));
    return { ...l, unitPrice, lineSubtotal, gstAmount: round2((lineSubtotal * l.gstPercent) / 100), listTotal: round2(l.listPrice * (Number(l.quantity) || 0)) };
  });
  const subtotal = round2(rows.reduce((s, r) => s + r.lineSubtotal, 0));
  const gst = round2(rows.reduce((s, r) => s + r.gstAmount, 0));
  const shipping = shippingCharge ?? null;
  return { rows, subtotal, gst, shipping, total: round2(subtotal + gst + (shipping ?? 0)), savings: round2(rows.reduce((s, r) => s + r.listTotal, 0) - subtotal) };
}
