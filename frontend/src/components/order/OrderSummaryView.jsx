import { formatCurrency } from '@/utils/formatCurrency';

const Row = ({ label, value, strong }) => (
  <div className={`flex justify-between gap-4 py-1 ${strong ? 'pt-2 mt-1 border-t border-line font-semibold text-primary text-lg' : ''}`}><dt className={strong ? '' : 'text-ink/70'}>{label}</dt><dd className="m-0">{value}</dd></div>
);

/** Items, totals and addresses of an order. Used by the confirmation page and the account order page. */
export default function OrderSummaryView({ order }) {
  const p = order.pricing;
  return (
    <>
      <section className="surface p-5 md:p-6" aria-labelledby="items">
        <h2 id="items" className="text-xl mb-3">Items</h2>
        <ul className="list-none m-0 p-0 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.sku} className="py-3 flex justify-between gap-4">
              <span className="min-w-0"><strong className="text-primary">{i.name}</strong><span className="block text-sm text-ink/70">{i.quantity} {i.unit} × {formatCurrency(i.unitPrice)} · GST {i.gstPercent}%</span></span>
              <span className="font-semibold">{formatCurrency(i.lineSubtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="m-0 mt-4 pt-3 border-t border-line">
          <Row label="Subtotal" value={formatCurrency(p.subtotal)} />
          <Row label="Shipping" value={p.shipping ? formatCurrency(p.shipping) : 'Free'} />
          {p.taxType === 'igst' ? <Row label="IGST" value={formatCurrency(p.igst)} /> : <><Row label="CGST" value={formatCurrency(p.cgst)} /><Row label="SGST" value={formatCurrency(p.sgst)} /></>}
          <Row label="Total" value={formatCurrency(p.total)} strong />
        </dl>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {[['Delivery address', order.shippingAddress], ['Billing address', order.billingAddress]].map(([title, a]) => (
          <div key={title} className="surface p-5">
            <h2 className="text-lg mb-2">{title}</h2>
            <p className="m-0 text-ink/80">{a.fullName}{a.companyName ? `, ${a.companyName}` : ''}<br />{[a.line1, a.line2].filter(Boolean).join(', ')}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
          </div>
        ))}
      </section>
    </>
  );
}
