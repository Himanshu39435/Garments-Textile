import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Button } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useCart from '@/hooks/useCart';
import useCheckoutDetails from '@/hooks/useCheckoutDetails';
import useCompleteOrder from '@/hooks/useCompleteOrder';
import CheckoutDetails from '@/components/cart/CheckoutDetails';
import CartSummary from '@/components/cart/CartSummary';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getCart } from '@/services/api/cartApi';
import { createOrder } from '@/services/api/orderApi';
import { formatCurrency } from '@/utils/formatCurrency';

export default function CheckoutPage() {
  usePageTitle('Checkout');
  const { cart, loading: cartLoading, refresh } = useCart();
  const details = useCheckoutDetails();
  const completeOrder = useCompleteOrder();
  const [totals, setTotals] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  // Once an order exists the cart is emptied on purpose. This stops the "empty cart" redirect below from racing the move to the order page.
  const orderPlaced = useRef(false);

  // Totals with the tax split for the chosen delivery state, computed by the server.
  useEffect(() => {
    if (!details.shippingId) { setTotals(null); return; }
    getCart(details.shippingId).then((r) => setTotals(r.data.totals)).catch(() => setTotals(null));
  }, [details.shippingId, cart.items]);

  if (cartLoading || details.addresses === null) return <LoadingSpinner fullPage />;
  if (!orderPlaced.current && (cart.itemCount === 0 || cart.hasIssues)) return <Navigate to="/cart" replace />;

  const placeOrder = async () => {
    setError('');
    if (!details.shippingId) { setError('Add or choose a delivery address to continue.'); return; }
    setPlacing(true);
    let order;
    try {
      order = (await createOrder(details.payload())).data;
      orderPlaced.current = true;
      await refresh().catch(() => {});
    } catch (e) {
      setError(e.message);
      setPlacing(false);
      refresh().catch(() => {});
      return;
    }
    await completeOrder(order, details.method);
  };

  const shown = totals ?? cart.totals;
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="text-4xl mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-8 min-w-0">
          {(error || details.loadError) && <Alert type="error" showIcon message={error || details.loadError} closable onClose={() => setError('')} />}
          <CheckoutDetails details={details} />
        </div>
        <CartSummary totals={shown}>
          <ul className="list-none m-0 mb-4 p-0 space-y-1 text-sm text-ink/75">
            {cart.items.map((i) => <li key={i.productId} className="flex justify-between gap-3"><span className="truncate">{i.name} × {i.quantity} {i.unit}</span><span>{formatCurrency(i.lineSubtotal)}</span></li>)}
          </ul>
          <Button type="primary" block size="large" loading={placing} onClick={placeOrder}>{details.method === 'razorpay' ? `Pay ${formatCurrency(shown.total)}` : 'Place order'}</Button>
          <p className="mt-3 mb-0 text-xs text-ink/60">Prices, GST and shipping are confirmed by our server when you place the order.</p>
        </CartSummary>
      </div>
    </div>
  );
}
