import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import { formatCurrency } from '@/utils/formatCurrency';
import { calculateTotals, getQuantityError } from '@/utils/pricing';

/** Quantity, slab rate, GST estimate and Add to cart. MOQ and stock are checked here and again by the server. */
export default function BulkPriceCalculator({ product }) {
  const [raw, setRaw] = useState(String(product.moq));
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const quantity = Number(raw);
  const error = getQuantityError(product, quantity);
  const totals = error ? null : calculateTotals(product, quantity);
  const unit = product.unit ?? 'm';

  const handleAdd = async () => {
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    setAdding(true);
    try {
      await addItem(product._id, quantity);
      setAdded(true);
      message.success('Added to cart');
    } catch (e) {
      message.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="surface p-5">
      <label htmlFor="calc-qty" className="block font-semibold text-primary mb-2">Quantity ({unit})</label>
      <input
        id="calc-qty"
        type="number"
        inputMode="numeric"
        min={product.moq}
        step={1}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby="calc-result"
        className="w-full h-12 px-4 border border-line rounded-fabric bg-secondary focus:border-primary outline-none"
      />
      <div id="calc-result" role="status" className="mt-3 text-sm">
        {error ? (
          <p className="m-0 text-red-700">{error}</p>
        ) : (
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-1">
            <dt className="text-ink/70">Rate</dt><dd className="m-0 text-right">{formatCurrency(totals.unitPrice)} per {unit}</dd>
            <dt className="text-ink/70">Subtotal</dt><dd className="m-0 text-right">{formatCurrency(totals.subtotal)}</dd>
            <dt className="text-ink/70">GST ({totals.gstPercent}%, excl. shipping)</dt><dd className="m-0 text-right">{formatCurrency(totals.gst)}</dd>
            <dt className="font-semibold text-primary pt-1 border-t border-line">Estimated total</dt><dd className="m-0 text-right font-semibold text-primary pt-1 border-t border-line">{formatCurrency(totals.total)}</dd>
          </dl>
        )}
      </div>
      <button type="button" onClick={handleAdd} disabled={Boolean(error) || adding} className="btn-accent w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
        {adding ? 'Adding' : user ? 'Add to cart' : 'Sign in to add to cart'}
      </button>
      {added && <p role="status" className="mt-2 mb-0 text-sm"><Link to="/cart" className="text-primary font-semibold">View cart</Link></p>}
    </div>
  );
}
