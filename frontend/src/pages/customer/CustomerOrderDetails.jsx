import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button } from 'antd';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import useOrderActions from '@/hooks/useOrderActions';
import BankTransferDetails from '@/components/order/BankTransferDetails';
import OrderStatusTimeline from '@/components/order/OrderStatusTimeline';
import OrderSummaryView from '@/components/order/OrderSummaryView';
import { OrderTags } from '@/components/order/OrderStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getOrder } from '@/services/api/orderApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

export default function CustomerOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(order ? `Order ${order.orderNumber}` : 'Order');

  const load = useCallback(() => getOrder(id).then((r) => setOrder(r.data)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorMessage title="Could not load this order" message={error} onRetry={() => { setError(''); load(); }} />;
  if (!order) return <LoadingSpinner />;
  return <Details order={order} reload={load} setOrder={setOrder} />;
}

function Details({ order, reload, setOrder }) {
  const actions = useOrderActions(order, { reload, setOrder });
  const bank = order.paymentMethod === 'bank_transfer' && order.status !== 'cancelled' && order.paymentStatus !== 'paid';
  return (
    <div className="space-y-6">
      <Link to="/account/orders" className="inline-flex items-center gap-1 text-primary"><ArrowLeft size={16} /> All orders</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl">{order.orderNumber}</h1>
          <p className="mt-1 mb-0 text-ink/70">Placed {formatDate(order.createdAt)}{order.invoiceNumber ? ` · Invoice ${order.invoiceNumber}` : ''}{order.quotation ? <> · From quotation <Link to={`/account/quotations/${order.quotation}`}>{order.quoteNumber}</Link></> : null}</p>
        </div>
        <div className="flex flex-wrap gap-2"><OrderTags order={order} /></div>
      </div>

      {actions.needsPayment && (
        <Alert type="warning" showIcon message="Payment pending" description="Complete payment to confirm this order." action={<Button type="primary" loading={actions.paying} onClick={actions.payNow}>Pay {formatCurrency(order.pricing.total)}</Button>} />
      )}
      {bank && <BankTransferDetails order={order} />}

      <section className="surface p-5 md:p-6" aria-labelledby="track"><h2 id="track" className="text-xl mb-4">Order progress</h2><OrderStatusTimeline order={order} /></section>
      <OrderSummaryView order={order} />
      {order.notes && <section className="surface p-5"><h2 className="text-lg mb-1">Your notes</h2><p className="m-0 text-ink/80">{order.notes}</p></section>}

      <div className="flex flex-wrap gap-3">
        {actions.hasInvoice && <Button type="primary" onClick={actions.saveInvoice} loading={actions.downloading}>Download invoice (PDF)</Button>}
        {actions.canCancel && <Button danger onClick={actions.confirmCancel}>Cancel order</Button>}
        <Link to="/contact" className="btn-outline no-underline">Need help with this order?</Link>
      </div>
    </div>
  );
}
