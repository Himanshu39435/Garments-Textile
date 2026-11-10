import PDFDocument from 'pdfkit';
import { getCommerceConfig } from '../config/commerceConfig.js';
import { generateInvoiceNumber } from '../utils/GenerateInvoiceNumber.js';

/** Gives a paid order its invoice number once. Normally called when payment is confirmed. */
export async function ensureInvoiceNumber(order) {
  if (order.invoiceNumber) return order;
  order.invoiceNumber = await generateInvoiceNumber();
  order.invoiceDate = order.paidAt ?? new Date();
  await order.save();
  return order;
}

// The built-in PDF fonts have no rupee glyph, so amounts are written as "Rs".
const money = (n) => `Rs ${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateText = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const addressLines = (a) => [a.fullName, a.companyName, a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`, `Phone: ${a.phone}`].filter(Boolean);

/** Streams a GST tax invoice for a paid order into `stream` (an HTTP response). */
export function writeInvoicePdf(order, stream) {
  const { seller, sellerStateCode } = (() => { const c = getCommerceConfig(); return { seller: c.seller, sellerStateCode: c.sellerStateCode }; })();
  const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Invoice ${order.invoiceNumber}`, Author: seller.name } });
  doc.pipe(stream);
  const L = 40;
  const R = 555;
  const ink = '#252525';
  const navy = '#142B3B';

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(20).text('TAX INVOICE', L, 40);
  doc.fontSize(12).text(seller.name, L, 70);
  doc.fillColor(ink).font('Helvetica').fontSize(9).text(seller.address, L, 86, { width: 260 });
  doc.text(`GSTIN: ${seller.gstin}`, L, doc.y + 2);
  if (seller.phone || seller.email) doc.text([seller.phone, seller.email].filter(Boolean).join('  |  '));

  const meta = [['Invoice no.', order.invoiceNumber], ['Invoice date', dateText(order.invoiceDate)], ['Order no.', order.orderNumber], ['Payment', order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : 'Bank transfer'], ['Place of supply', `${order.shippingAddress.state} (${order.shippingAddress.stateCode})`]];
  let y = 40;
  meta.forEach(([k, v]) => { doc.font('Helvetica').fontSize(9).fillColor('#666').text(k, 340, y, { width: 90 }); doc.fillColor(ink).font('Helvetica-Bold').text(v, 430, y, { width: 125 }); y += 15; });

  y = Math.max(doc.y, 135) + 14;
  const blockTop = y;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(navy).text('Bill to', L, blockTop).text('Ship to', 300, blockTop);
  doc.font('Helvetica').fontSize(9).fillColor(ink);
  doc.text(addressLines(order.billingAddress).join('\n'), L, blockTop + 14, { width: 240 });
  const billEnd = doc.y;
  if (order.customer?.gstin) doc.text(`GSTIN: ${order.customer.gstin}`, L, billEnd + 2);
  const afterBill = doc.y;
  doc.text(addressLines(order.shippingAddress).join('\n'), 300, blockTop + 14, { width: 240 });
  y = Math.max(afterBill, doc.y) + 16;

  // items table
  const cols = [{ t: 'Item', x: L, w: 175 }, { t: 'HSN', x: 215, w: 45 }, { t: 'Qty', x: 260, w: 55, r: true }, { t: 'Rate', x: 315, w: 60, r: true }, { t: 'Taxable', x: 375, w: 70, r: true }, { t: 'GST %', x: 445, w: 40, r: true }, { t: 'Amount', x: 485, w: 70, r: true }];
  const header = (top) => {
    doc.rect(L, top, R - L, 20).fill('#F8F6F1');
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(8.5);
    cols.forEach((c) => doc.text(c.t, c.x + 3, top + 6, { width: c.w - 6, align: c.r ? 'right' : 'left' }));
    return top + 24;
  };
  y = header(y);
  doc.font('Helvetica').fontSize(8.5).fillColor(ink);
  order.items.forEach((i) => {
    if (y > 730) { doc.addPage(); y = header(40); doc.font('Helvetica').fontSize(8.5).fillColor(ink); }
    const cells = [`${i.name}\nSKU ${i.sku}`, i.hsnCode ?? '-', `${i.quantity} ${i.unit}`, money(i.unitPrice), money(i.lineSubtotal), `${i.gstPercent}%`, money(i.lineSubtotal + i.gstAmount)];
    const h = Math.max(...cells.map((t, k) => doc.heightOfString(t, { width: cols[k].w - 6 }))) + 8;
    cells.forEach((t, k) => doc.text(t, cols[k].x + 3, y, { width: cols[k].w - 6, align: cols[k].r ? 'right' : 'left' }));
    y += h;
    doc.moveTo(L, y - 3).lineTo(R, y - 3).strokeColor('#E4DFD3').lineWidth(0.5).stroke();
  });

  // totals
  if (y > 640) { doc.addPage(); y = 40; }
  y += 10;
  const p = order.pricing;
  const rows = [['Taxable value', money(p.subtotal)], ['Shipping', money(p.shipping)]];
  if (p.taxType === 'igst') rows.push(['IGST', money(p.igst)]);
  else rows.push(['CGST', money(p.cgst)], ['SGST', money(p.sgst)]);
  rows.forEach(([k, v]) => { doc.font('Helvetica').fontSize(9).fillColor(ink).text(k, 360, y, { width: 100 }).text(v, 455, y, { width: 100, align: 'right' }); y += 15; });
  doc.moveTo(360, y).lineTo(R, y).strokeColor(navy).lineWidth(1).stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(navy).text('Total', 360, y + 6, { width: 100 }).text(money(p.total), 455, y + 6, { width: 100, align: 'right' });
  y += 34;
  doc.font('Helvetica').fontSize(8).fillColor('#666').text(`Tax shown as ${p.taxType === 'igst' ? 'IGST (inter-state supply)' : 'CGST + SGST (supply within ' + (order.shippingAddress.stateCode === sellerStateCode ? 'the seller state' : 'state') + ')'}. Shipping is shown without separate tax.`, L, y, { width: R - L });
  doc.text('This is a computer-generated invoice and does not require a signature.', L, doc.y + 4, { width: R - L });
  doc.end();
}
