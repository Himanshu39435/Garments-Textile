import { formatCurrency } from '@/utils/formatCurrency';

/** Unit price with MOQ and optional bulk rate. */
export default function ProductPrice({ price, unit = 'm', moq, bulkPrice, size = 'md' }) {
  return (
    <div>
      <p className={`m-0 font-semibold text-primary ${size === 'lg' ? 'text-3xl font-display' : 'text-lg'}`}>
        {formatCurrency(price)} <span className="text-sm font-normal text-ink/60">per {unit}</span>
      </p>
      <p className="m-0 text-sm text-ink/70">
        MOQ {moq} {unit}
        {bulkPrice ? <span className="text-accent-dark"> · from {formatCurrency(bulkPrice)} on bulk slabs</span> : null}
      </p>
    </div>
  );
}
