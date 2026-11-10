import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Alert, Button } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useCheckoutDetails from '@/hooks/useCheckoutDetails';
import useCompleteOrder from '@/hooks/useCompleteOrder';
import CheckoutDetails from '@/components/cart/CheckoutDetails';
import CartSummary from '@/components/cart/CartSummary';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { convertQuotation, getQuotation } from '@/services/api/quotationApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

/** /quotation-checkout/:id: choose address and payment, then order at the quoted prices. */
export default function QuoteCheckoutPage() {
  usePageTitle('Order from quotation');
  const { id } = useParams();
  const details = useCheckoutDetails();
  const completeOrder = useCompleteOrder();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [actionError, setActionError] = useState('');
  const ordered = useRef(false);

  // Reload with the tax split whenever the delivery address changes.
  useEffect(() => {
    if (details.addresses === null) return;
    getQuotation(id, details.shippingId).then((r) => setQuote(r.data)).catch((e) => setError(e.message));
  }, [id, details.shippingId, details.addresses]);

  if (error) return <div className="container-page py-14"><ErrorMessage title="Could not load this quotation" message={error} /></div>;
  if (!quote || details.addresses === null) return <LoadingSpinner fullPage />;
  if (!ordered.current && quote.status !== 'approved') return <Navigate to={`/account/quotations/${id}`} replace />;

  const place = async () => {
    setActionError('');
    if (!details.shippingId) { setActionError('Add or choose a delivery address to continue.'); return; }
    setPlacing(true);
    let order;
    try {
      order = (await convertQuotation(id, details.payload())).data;
      ordered.current = true;
    } catch (e) {
      setActionError(e.message);
      setPlacing(false);
      return;
    }
    await completeOrder(order, details.method);
  };

  const totals = quote.priced.totals;
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="text-4xl">Order from quotation</h1>
      <p className="mt-2 mb-8 text-ink/70">{quote.quoteNumber} · prices fixed until {formatDate(quote.validUntil)}. <Link to={`/account/quotations/${id}`}>Back to quotation</Link></p>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-8 min-w-0">
          {(actionError || details.loadError) && <Alert type="error" showIcon message={actionError || details.loadError} closable onClose={() => setActionError('')} />}
          <CheckoutDetails details={details} />
        </div>
        <CartSummary totals={totals} title="Quoted order">
          <ul className="list-none m-0 mb-4 p-0 space-y-1 text-sm text-ink/75">
            {quote.priced.lines.map((l) => <li key={l.sku} className="flex justify-between gap-3"><span className="truncate">{l.name} × {l.quantity} {l.unit}</span><span>{formatCurrency(l.lineSubtotal)}</span></li>)}
          </ul>
          <Button type="primary" block size="large" loading={placing} onClick={place}>{details.method === 'razorpay' ? `Pay ${formatCurrency(totals.total)}` : 'Place order'}</Button>
          <p className="mt-3 mb-0 text-xs text-ink/60">Stock is reserved when you place the order. GST is split by your delivery state.</p>
        </CartSummary>
      </div>
    </div>
  );
}
