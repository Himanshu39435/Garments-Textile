import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DatePicker, Input, Select, Table } from 'antd';
import dayjs from 'dayjs';
import usePageTitle from '@/hooks/usePageTitle';
import usePanelPaths from '@/hooks/usePanelPaths';
import { OrderTags } from '@/components/order/OrderStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import { listAdminOrders } from '@/services/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const PAGE_SIZE = 15;
const opts = (items) => [{ value: '', label: items[0] }, ...items.slice(1).map(([value, label]) => ({ value, label }))];
const STATUS = opts(['All statuses', ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']]);
const PAYMENT = opts(['All payments', ['awaiting_transfer', 'Awaiting transfer'], ['pending', 'Payment pending'], ['paid', 'Paid'], ['refunded', 'Refunded']]);
const METHOD = opts(['All methods', ['razorpay', 'Online (Razorpay)'], ['bank_transfer', 'Bank transfer']]);

export default function AdminOrderManagement() {
  usePageTitle('Orders');
  const { base } = usePanelPaths();
  const [params, setParams] = useSearchParams();
  const f = { search: params.get('search') ?? '', status: params.get('status') ?? '', paymentStatus: params.get('paymentStatus') ?? '', paymentMethod: params.get('paymentMethod') ?? '', from: params.get('from') ?? '', to: params.get('to') ?? '' };
  const page = Number(params.get('page')) || 1;
  const [searchText, setSearchText] = useState(f.search);
  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listAdminOrders({ ...f, page, limit: PAGE_SIZE })
      .then((r) => setState({ rows: r.data, meta: r.meta, loading: false, error: '' }))
      .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  useEffect(load, [load]);

  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); if (!('page' in patch)) next.delete('page'); setParams(next); };

  const columns = [
    { title: 'Order', key: 'no', render: (_, o) => <Link to={`${base}/orders/${o._id}`} className="font-semibold whitespace-nowrap">{o.orderNumber}</Link> },
    { title: 'Customer', key: 'customer', render: (_, o) => <span>{o.customer?.name}{o.customer?.companyName ? <span className="block text-xs text-ink/60">{o.customer.companyName}</span> : null}</span> },
    { title: 'Placed', dataIndex: 'createdAt', key: 'createdAt', responsive: ['md'], render: (v) => <span className="whitespace-nowrap">{formatDate(v)}</span> },
    { title: 'Total', key: 'total', align: 'right', render: (_, o) => <span className="whitespace-nowrap">{formatCurrency(o.pricing.total)}</span> },
    { title: 'Status', key: 'status', render: (_, o) => <span className="flex gap-1 flex-wrap"><OrderTags order={o} /></span> },
    { title: 'Invoice', dataIndex: 'invoiceNumber', key: 'invoice', responsive: ['lg'], render: (v) => v ?? <span className="text-ink/40">—</span> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Orders</h1>
      <div className="surface p-4 flex flex-wrap items-center gap-3">
        <Input.Search aria-label="Search orders" placeholder="Order no., customer, email, company" allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} onSearch={(v) => update({ search: v.trim() })} style={{ maxWidth: 300 }} />
        <Select aria-label="Filter by order status" value={f.status} onChange={(v) => update({ status: v })} options={STATUS} style={{ width: 150 }} />
        <Select aria-label="Filter by payment status" value={f.paymentStatus} onChange={(v) => update({ paymentStatus: v })} options={PAYMENT} style={{ width: 170 }} />
        <Select aria-label="Filter by payment method" value={f.paymentMethod} onChange={(v) => update({ paymentMethod: v })} options={METHOD} style={{ width: 170 }} />
        <DatePicker.RangePicker aria-label="Placed between" value={f.from && f.to ? [dayjs(f.from), dayjs(f.to)] : null} onChange={(r) => update({ from: r?.[0]?.format('YYYY-MM-DD') ?? '', to: r?.[1]?.format('YYYY-MM-DD') ?? '' })} />
      </div>
      {state.error ? <ErrorMessage title="Could not load orders" message={state.error} onRetry={load} /> : (
        <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'No orders match these filters.' }}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: state.meta?.total ?? 0, showSizeChanger: false, hideOnSinglePage: true, onChange: (p) => update({ page: p > 1 ? String(p) : '' }) }} />
      )}
    </div>
  );
}
