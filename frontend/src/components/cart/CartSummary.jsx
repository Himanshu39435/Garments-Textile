import { formatCurrency } from '@/utils/formatCurrency';

const Row = ({ label, value, strong }) => (
  <div className={`flex justify-between gap-4 ${strong ? 'pt-3 mt-1 border-t border-line text-lg font-semibold text-primary' : ''}`}>
    <dt className={strong ? '' : 'text-ink/70'}>{label}</dt><dd className="m-0">{value}</dd>
  </div>
);

/** Order totals from the server. `children` is the call-to-action button area. */
export default function CartSummary({ totals, children, title = 'Order summary' }) {
  const remaining = totals.freeShippingThreshold - totals.subtotal;
  return (
    <aside className="surface p-5 md:p-6 lg:sticky lg:top-28" aria-label={title}>
      <h2 className="text-xl mb-4">{title}</h2>
      <dl className="m-0 space-y-2">
        <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
        <Row label="Shipping" value={totals.shipping === 0 ? (totals.subtotal > 0 ? 'Free' : '—') : formatCurrency(totals.shipping)} />
        {totals.taxType === 'igst' && <Row label="IGST" value={formatCurrency(totals.igst)} />}
        {totals.taxType === 'cgst_sgst' && (<><Row label="CGST" value={formatCurrency(totals.cgst)} /><Row label="SGST" value={formatCurrency(totals.sgst)} /></>)}
        {!totals.taxType && <Row label="GST" value={formatCurrency(totals.gst)} />}
        <Row label="Total" value={formatCurrency(totals.total)} strong />
      </dl>
      {totals.subtotal > 0 && remaining > 0 && totals.shipping > 0 && (
        <p className="mt-3 mb-0 text-sm text-accent-dark">Add {formatCurrency(remaining)} more for free shipping.</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </aside>
  );
}
