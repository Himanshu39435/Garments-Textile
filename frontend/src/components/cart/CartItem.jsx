import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import FabricSwatch from '@/components/common/FabricSwatch';
import QuantitySelector from '@/components/cart/QuantitySelector';
import { formatCurrency } from '@/utils/formatCurrency';

const ISSUE_TEXT = {
  unavailable: () => 'This fabric is no longer available. Remove it to continue.',
  below_moq: (i) => `Minimum order is ${i.moq} ${i.unit}. Increase the quantity.`,
  insufficient_stock: (i) => `Only ${i.stock} ${i.unit} in stock. Reduce the quantity.`,
};

/** One cart line. Prices shown are the server's. */
export default function CartItem({ item, busy, onQuantityChange, onRemove }) {
  const bulk = item.basePrice && item.unitPrice < item.basePrice;
  const available = item.issue !== 'unavailable';
  return (
    <li className="surface p-4 flex gap-4">
      <div className="h-24 w-20 shrink-0 bg-secondary p-2">
        {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : item.swatch ? <FabricSwatch swatch={item.swatch} className="h-full w-full" depth={3} /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            {item.slug ? <Link to={`/products/${item.slug}`} className="font-display text-lg text-primary no-underline hover:text-accent-dark">{item.name}</Link> : <p className="m-0 font-display text-lg">{item.name}</p>}
            {item.sku && <p className="m-0 text-sm text-ink/60">SKU {item.sku}</p>}
          </div>
          <button type="button" onClick={onRemove} disabled={busy} aria-label={`Remove ${item.name}`} className="h-9 w-9 grid place-items-center bg-transparent border-0 text-ink/60 hover:text-red-700 cursor-pointer shrink-0"><Trash2 size={18} /></button>
        </div>

        {available && (
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <QuantitySelector value={item.quantity} min={item.moq} max={item.stock} disabled={busy} onCommit={onQuantityChange} label={`Quantity of ${item.name} in ${item.unit}`} />
              <p className="mt-1 mb-0 text-sm text-ink/60">{formatCurrency(item.unitPrice)} per {item.unit}{bulk ? ' (bulk rate)' : ''} · MOQ {item.moq}</p>
            </div>
            <p className="m-0 font-semibold text-primary text-lg">{formatCurrency(item.lineSubtotal)}</p>
          </div>
        )}
        {item.issue && <p role="alert" className="mt-2 mb-0 text-sm text-red-700">{ISSUE_TEXT[item.issue](item)}</p>}
      </div>
    </li>
  );
}
