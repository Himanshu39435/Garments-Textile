import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Segmented } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import { OrderTags } from '@/components/order/OrderStatusTag';
import Pagination from '@/components/common/Pagination';
import ErrorMessage from '@/components/common/ErrorMessage';
import { listOrders } from '@/services/api/orderApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const PAGE_SIZE = 8;
const FILTERS = [['', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];

export default function CustomerOrders() {
  usePageTitle('My orders');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Number(params.get('page')) || 1;
  const [state, setState] = useState({ orders: [], meta: null, loading: true, error: '' });

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listOrders({ status: status || undefined, page, limit: PAGE_SIZE })
      .then((r) => setState({ orders: r.data, meta: r.meta, loading: false, error: '' }))
      .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  };
  useEffect(load, [status, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); setParams(next); };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">My orders</h1>
      <div className="overflow-x-auto pb-1"><Segmented value={status} onChange={(v) => update({ status: v, page: '' })} options={FILTERS.map(([value, label]) => ({ value, label }))} aria-label="Filter by status" /></div>

      {state.error ? <ErrorMessage title="Could not load orders" message={state.error} onRetry={load} /> : state.loading ? (
        <div className="space-y-3 animate-pulse" role="status" aria-label="Loading orders">{[0, 1, 2].map((i) => <div key={i} className="surface h-24" />)}</div>
      ) : state.orders.length === 0 ? (
        <div className="surface p-10 text-center">
          <p className="mt-0 text-ink/70">{status ? `No ${status} orders.` : 'You have not placed an order yet.'}</p>
          {status ? <button type="button" className="btn-outline" onClick={() => update({ status: '', page: '' })}>Show all orders</button> : <Link to="/products" className="btn-primary no-underline">Browse fabrics</Link>}
        </div>
      ) : (
        <>
          <ul className="list-none m-0 p-0 space-y-3">
            {state.orders.map((o) => (
              <li key={o._id}>
                <Link to={`/account/orders/${o._id}`} className="surface p-4 md:p-5 block no-underline hover:shadow-lift transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0"><strong className="text-primary text-lg">{o.orderNumber}</strong><span className="block text-sm text-ink/70">{formatDate(o.createdAt)}</span></div>
                    <strong className="text-primary text-lg">{formatCurrency(o.pricing.total)}</strong>
                  </div>
                  <p className="my-2 text-sm text-ink/75">{o.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}</p>
                  <div className="flex flex-wrap gap-2"><OrderTags order={o} /></div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={state.meta?.total ?? 0} onChange={(p) => update({ page: p > 1 ? String(p) : '' })} />
        </>
      )}
    </div>
  );
}
