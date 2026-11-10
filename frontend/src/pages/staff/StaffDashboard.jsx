import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Tag } from 'antd';
import { RefreshCw } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import useAuth from '@/hooks/useAuth';
import { OrderStatusTag } from '@/components/order/OrderStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getStaffDashboard } from '@/services/api/staffApi';
import { formatDate } from '@/utils/formatDate';

const Panel = ({ title, action, children }) => (
  <section className="surface p-5 min-w-0" aria-label={title}>
    <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-xl m-0">{title}</h2>{action}</div>
    {children}
  </section>
);

function Task({ label, value, detail, active, to }) {
  return (
    <Link to={to} className={`surface p-4 border-l-4 block no-underline hover:shadow-lift transition-shadow ${active ? 'border-l-accent-dark' : 'border-l-line'}`}>
      <p className="m-0 text-sm text-ink/70">{label}</p>
      <p className={`m-0 font-display text-2xl ${active ? 'text-primary' : 'text-ink/40'}`}>{value}</p>
      <p className="m-0 text-sm text-ink/60">{detail}</p>
    </Link>
  );
}

/** Staff home: what needs doing today. It has no revenue or sales figures on purpose; those are on the admin dashboard. */
export default function StaffDashboard() {
  usePageTitle('Staff dashboard');
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setError('');
    setRefreshing(true);
    return getStaffDashboard().then((r) => setData(r.data)).catch((e) => setError(e.message)).finally(() => setRefreshing(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const heading = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-4xl">Hello, {user.name.split(' ')[0]}</h1>
        <p className="m-0 mt-1 text-sm text-ink/60">{user.designation ? `${user.designation} · ` : ''}Here is what needs doing today.</p>
      </div>
      <Button icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={load} disabled={refreshing}>Refresh</Button>
    </div>
  );

  if (error && !data) return <div className="space-y-6">{heading}<ErrorMessage title="Could not load your dashboard" message={error} onRetry={load} /></div>;
  if (!data) {
    return (
      <div className="animate-pulse space-y-6" role="status" aria-label="Loading dashboard">
        <div className="h-10 w-48 bg-white" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="surface h-28" />)}</div>
        <div className="surface h-80" />
      </div>
    );
  }

  const a = data.attention;
  return (
    <div className="space-y-6">
      {heading}
      {error && <ErrorMessage title="Could not refresh" message={error} onRetry={load} />}

      <section aria-label="Today's tasks" className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Task label="Paid orders to start" value={a.toProcess} detail={a.toProcess ? 'Confirmed, not yet processing' : 'All caught up'} active={a.toProcess > 0} to="/staff/orders?status=confirmed" />
        <Task label="Being prepared" value={a.processing} detail={a.processing ? 'Ready to ship when packed' : 'Nothing in progress'} active={a.processing > 0} to="/staff/orders?status=processing" />
        <Task label="Quote requests" value={a.quotesToReview} detail={a.quotesToReview ? 'Waiting for prices' : 'Nothing waiting'} active={a.quotesToReview > 0} to="/staff/quotations?status=requested" />
        <Task label="Low-stock fabrics" value={a.lowStock} detail={a.lowStock ? `${a.outOfStock} out of stock` : 'Stock levels healthy'} active={a.lowStock > 0} to="/staff/stock?lowStock=true" />
      </section>

      <section aria-label="Also on the floor" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="surface p-5"><p className="m-0 text-sm text-ink/70">Shipped, not yet delivered</p><p className="mt-1 mb-0 font-display text-2xl md:text-3xl text-primary">{a.inTransit}</p></div>
        <div className="surface p-5"><p className="m-0 text-sm text-ink/70">Quotes with customers</p><p className="mt-1 mb-0 font-display text-2xl md:text-3xl text-primary">{a.quotesWithCustomers}</p><p className="mt-1 mb-0 text-sm text-ink/60">Approved and still valid</p></div>
        <div className="surface p-5"><p className="m-0 text-sm text-ink/70">Bank transfers pending</p><p className="mt-1 mb-0 font-display text-2xl md:text-3xl text-primary">{a.awaitingPayment}</p><p className="mt-1 mb-0 text-sm text-ink/60">An admin confirms these</p></div>
        <div className="surface p-5"><p className="m-0 text-sm text-ink/70">Handled by you this month</p><p className="mt-1 mb-0 font-display text-2xl md:text-3xl text-primary">{data.myMonth.ordersHandled + data.myMonth.quotationsHandled}</p><p className="mt-1 mb-0 text-sm text-ink/60">{data.myMonth.ordersHandled} orders · {data.myMonth.quotationsHandled} quotations</p></div>
      </section>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <Panel title="Orders to work on" action={<Link to="/staff/orders">All orders</Link>}>
            {data.orderQueue.length === 0 ? <p className="m-0 text-ink/60">No orders waiting. Nice work.</p> : (
              <ul className="list-none m-0 p-0 divide-y divide-line">
                {data.orderQueue.map((o) => (
                  <li key={o._id}>
                    <Link to={`/staff/orders/${o._id}`} className="py-3 flex flex-wrap items-center justify-between gap-2 no-underline">
                      <span className="min-w-0"><strong className="text-primary">{o.orderNumber}</strong><span className="block text-sm text-ink/70 truncate">{o.customer?.companyName || o.customer?.name} · {o.totalQuantity.toLocaleString('en-IN')} {o.unit ?? 'm'}</span></span>
                      <span className="flex items-center gap-3"><span className="text-sm text-ink/60">{formatDate(o.createdAt)}</span><OrderStatusTag status={o.status} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 mb-0 text-xs text-ink/60">Oldest first.</p>
          </Panel>

          <Panel title="Quote requests to answer" action={<Link to="/staff/quotations?status=requested">All requests</Link>}>
            {data.quoteQueue.length === 0 ? <p className="m-0 text-ink/60">No quote requests waiting.</p> : (
              <ul className="list-none m-0 p-0 divide-y divide-line">
                {data.quoteQueue.map((q) => (
                  <li key={q._id}>
                    <Link to={`/staff/quotations/${q._id}`} className="py-3 flex flex-wrap items-center justify-between gap-2 no-underline">
                      <span className="min-w-0"><strong className="text-primary">{q.quoteNumber}</strong><span className="block text-sm text-ink/70 truncate">{q.customer?.companyName || q.customer?.name} · {q.items.map((i) => i.name).slice(0, 2).join(', ')}{q.items.length > 2 ? ` +${q.items.length - 2}` : ''}</span></span>
                      <span className="text-sm text-ink/60">{q.requiredBy ? `Needed by ${formatDate(q.requiredBy)}` : `Asked ${formatDate(q.createdAt)}`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Low stock" action={<Link to="/staff/stock?lowStock=true">Stock</Link>}>
          {data.lowStockProducts.length === 0 ? <p className="m-0 text-ink/60">Every active fabric is above its threshold.</p> : (
            <ul className="list-none m-0 p-0 divide-y divide-line">
              {data.lowStockProducts.map((p) => (
                <li key={p.sku} className="py-2 flex items-center justify-between gap-3"><span className="min-w-0"><span className="block text-primary font-semibold truncate">{p.name}</span><span className="text-xs text-ink/60">{p.sku} · alert at {p.threshold} m</span></span>{p.stock <= 0 ? <Tag color="red" className="!m-0">Out of stock</Tag> : <Tag color="gold" className="!m-0">{p.stock} m left</Tag>}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 mb-0 text-xs text-ink/60">Tell an admin when something needs re-ordering. Stock changes are made by admins for now.</p>
        </Panel>
      </div>
    </div>
  );
}
