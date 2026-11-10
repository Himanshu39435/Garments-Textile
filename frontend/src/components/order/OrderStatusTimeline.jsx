import { Check } from 'lucide-react';
import { formatDate } from '@/utils/formatDate';

const RANK = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };
const historyDate = (order, status) => order.statusHistory?.find((h) => h.status === status)?.at;

/** Order tracking: placed, paid, processing, shipped, delivered. Shows shipment details once the admin adds them. */
export default function OrderStatusTimeline({ order }) {
  if (order.status === 'cancelled') {
    return <p className="m-0 text-ink/80">This order was cancelled{order.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ''}.</p>;
  }
  const rank = RANK[order.status] ?? 0;
  const shipment = order.shipment ?? {};
  const steps = [
    { key: 'placed', label: 'Order placed', at: order.createdAt, done: true },
    { key: 'paid', label: 'Payment received', at: order.paidAt, done: order.paymentStatus === 'paid' },
    { key: 'processing', label: 'Preparing your fabric', at: historyDate(order, 'processing'), done: rank >= 2 },
    { key: 'shipped', label: 'Shipped', at: shipment.shippedAt ?? historyDate(order, 'shipped'), done: rank >= 3 },
    { key: 'delivered', label: 'Delivered', at: shipment.deliveredAt ?? historyDate(order, 'delivered'), done: rank >= 4 },
  ];
  const currentIndex = steps.findIndex((s) => !s.done);

  return (
    <ol className="list-none m-0 p-0" aria-label="Order progress">
      {steps.map((s, i) => (
        <li key={s.key} className="flex gap-4" aria-current={i === currentIndex ? 'step' : undefined}>
          <div className="flex flex-col items-center">
            <span className={`h-7 w-7 rounded-full grid place-items-center border-2 shrink-0 ${s.done ? 'bg-primary border-primary text-white' : i === currentIndex ? 'border-accent-dark text-accent-dark bg-white' : 'border-line bg-white'}`}>
              {s.done ? <Check size={14} aria-hidden="true" /> : null}
            </span>
            {i < steps.length - 1 && <span className={`w-0.5 flex-1 min-h-6 ${s.done ? 'bg-primary' : 'bg-line'}`} aria-hidden="true" />}
          </div>
          <div className="pb-5">
            <p className={`m-0 font-semibold ${s.done ? 'text-primary' : 'text-ink/50'}`}>{s.label}<span className="sr-only">{s.done ? ' (done)' : ' (not yet)'}</span></p>
            {s.at && s.done && <p className="m-0 text-sm text-ink/60">{formatDate(s.at)}</p>}
            {s.key === 'shipped' && s.done && (shipment.courier || shipment.trackingNumber) && (
              <p className="m-0 mt-1 text-sm text-ink/75">
                {shipment.courier}{shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ''}
                {shipment.trackingUrl && <> · <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">Track shipment</a></>}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
