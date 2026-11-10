import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatCurrency';

const Row = ({ label, value, strong, accent }) => (
  <div className={`flex justify-between gap-4 py-1 ${strong ? 'pt-2 mt-1 border-t border-line font-semibold text-primary text-lg' : ''} ${accent ? 'text-emerald-800' : ''}`}><dt className={strong || accent ? '' : 'text-ink/70'}>{label}</dt><dd className="m-0">{value}</dd></div>
);

/**
 * Lines and totals of a quotation. Priced quotes show the rate we agreed beside the list price;
 * requests still waiting for a quote show list prices as a guide only.
 */
export default function QuotationSummaryView({ quote }) {
  const priced = quote.priced;
  const lines = priced?.lines ?? quote.items;
  const totals = priced?.totals ?? quote.estimate;
  return (
    <section className="surface p-5 md:p-6" aria-labelledby="q-items">
      <h2 id="q-items" className="text-xl mb-3">{priced ? 'Quoted items' : 'Requested items'}</h2>
      <ul className="list-none m-0 p-0 divide-y divide-line">
        {lines.map((l) => (
          <li key={l.sku} className="py-3 flex justify-between gap-4">
            <span className="min-w-0">
              <strong className="text-primary">{l.name}</strong>
              <span className="block text-sm text-ink/70">{l.quantity} {l.unit} · SKU {l.sku}{l.requestedPrice ? ` · your target ${formatCurrency(l.requestedPrice)}/m` : ''}</span>
              {priced && <span className="block text-sm text-ink/70">{l.listPrice > l.unitPrice && <s className="mr-2">{formatCurrency(l.listPrice)}</s>}<strong className="text-primary">{formatCurrency(l.unitPrice)}</strong> per {l.unit} · GST {l.gstPercent}%</span>}
              {!priced && <span className="block text-sm text-ink/70">List price {formatCurrency(l.listPrice)} per {l.unit}</span>}
            </span>
            <span className="font-semibold shrink-0">{formatCurrency(priced ? l.lineSubtotal : l.listPrice * l.quantity)}</span>
          </li>
        ))}
      </ul>
      {totals && (
        <dl className="m-0 mt-4 pt-3 border-t border-line">
          <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <Row label="Shipping" value={totals.shipping ? formatCurrency(totals.shipping) : 'Free'} />
          {totals.taxType === 'igst' && <Row label="IGST" value={formatCurrency(totals.igst)} />}
          {totals.taxType === 'cgst_sgst' && (<><Row label="CGST" value={formatCurrency(totals.cgst)} /><Row label="SGST" value={formatCurrency(totals.sgst)} /></>)}
          {!totals.taxType && <Row label="GST" value={formatCurrency(totals.gst)} />}
          {priced && totals.savings > 0 && <Row label="You save versus list price" value={formatCurrency(totals.savings)} accent />}
          <Row label={priced ? 'Total' : 'Estimated total at list prices'} value={formatCurrency(totals.total)} strong />
        </dl>
      )}
      {!priced && <p className="mt-3 mb-0 text-sm text-ink/60">This is a guide only. Our team will send you a quotation with special pricing for your quantity. See also <Link to="/contact">contact us</Link> if it is urgent.</p>}
    </section>
  );
}
