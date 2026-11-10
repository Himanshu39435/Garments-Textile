import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useOrderActions from '@/hooks/useOrderActions';
import BankTransferDetails from '@/components/order/BankTransferDetails';
import OrderSummaryView from '@/components/order/OrderSummaryView';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getOrder } from '@/services/api/orderApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

/** Shown right after checkout. Handles paid, payment-pending, bank-transfer and cancelled states. */
export default function OrderSuccessPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(order ? `Order ${order.orderNumber}` : 'Order');

  const load = useCallback(() => getOrder(id).then((r) => setOrder(r.data)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="container-page py-14"><ErrorMessage title="Could not load this order" message={error} onRetry={() => { setError(''); load(); }} /></div>;
  if (!order) return <LoadingSpinner fullPage />;
  return <OrderSuccessContent order={order} params={params} reload={load} setOrder={setOrder} />;
}

function OrderSuccessContent({ order, params, reload, setOrder }) {
  const actions = useOrderActions(order, { reload, setOrder });
  const cancelled = order.status === 'cancelled';
  const bank = order.paymentMethod === 'bank_transfer' && !cancelled && order.paymentStatus !== 'paid';
  const heading = cancelled ? 'Order cancelled' : order.paymentStatus === 'paid' ? 'Thank you, payment received' : actions.needsPayment ? 'Order placed, payment pending' : 'Order placed';

  return (
    <div className="container-page py-10 md:py-14 max-w-4xl space-y-6">
      <div>
        <h1 className="text-4xl md:text-5xl">{heading}</h1>
        <p className="mt-3 mb-0 text-ink/75">Order <strong>{order.orderNumber}</strong> · {formatDate(order.createdAt)}. <Link to={`/account/orders/${order._id}`}>Track it in your account</Link>.</p>
      </div>

      {actions.needsPayment && (
        <Alert type={params.get('payment') === 'pending' ? 'warning' : 'info'} showIcon message="Complete your payment to confirm this order"
          description="Your fabric is reserved for now. If you already paid, this page updates once the bank confirms it."
          action={<Button type="primary" loading={actions.paying} onClick={actions.payNow}>Pay {formatCurrency(order.pricing.total)}</Button>} />
      )}
      {bank && <BankTransferDetails order={order} />}
      <OrderSummaryView order={order} />

      <div className="flex flex-wrap gap-3">
        <Link to="/products" className="btn-primary no-underline">Continue shopping</Link>
        {actions.hasInvoice && <Button onClick={actions.saveInvoice} loading={actions.downloading}>Download invoice</Button>}
        {actions.canCancel && <Button onClick={actions.confirmCancel} danger>Cancel order</Button>}
      </div>
    </div>
  );
}
