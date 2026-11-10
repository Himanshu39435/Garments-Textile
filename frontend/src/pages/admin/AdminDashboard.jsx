import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Tag } from 'antd';
import { RefreshCw } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import StatCard from '@/components/admin/StatCard';
import MonthlySalesChart from '@/components/admin/MonthlySalesChart';
import CategorySalesChart from '@/components/admin/CategorySalesChart';
import { OrderTags } from '@/components/order/OrderStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getAdminDashboard } from '@/services/api/adminApi';
import { formatCurrency, formatCurrencyWhole } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const Panel = ({ title, children, className = '' }) => (
  <section className={`surface p-5 min-w-0 ${className}`} aria-label={title}><h2 className="text-xl mb-4">{title}</h2>{children}</section>
);

function Attention({ label, value, detail, active, to }) {
  return (
    <Link to={to} className={`surface p-4 border-l-4 block no-underline hover:shadow-lift transition-shadow ${active ? 'border-l-accent-dark' : 'border-l-line'}`}>
      <p className="m-0 text-sm text-ink/70">{label}</p>
      <p className={`m-0 font-display text-2xl ${active ? 'text-primary' : 'text-ink/40'}`}>{value}</p>
      <p className="m-0 text-sm text-ink/60">{detail}</p>
    </Link>
  );
}

const orderColumns = [
  { title: 'Order', dataIndex: 'orderNumber', key: 'orderNumber', render: (v) => <strong className="text-primary whitespace-nowrap">{v}</strong> },
  { title: 'Customer', key: 'customer', render: (_, o) => (
    <span>{o.customer?.name}{o.customer?.companyName ? <span className="block text-xs text-ink/60">{o.customer.companyName}</span> : null}
      <span className="md:hidden flex gap-1 flex-wrap mt-1"><OrderTags order={o} /></span>
    </span>
  ) },
  { title: 'Total', key: 'total', align: 'right', render: (_, o) => <span className="whitespace-nowrap">{formatCurrency(o.pricing.total)}</span> },
  { title: 'Status', key: 'status', responsive: ['md'], render: (_, o) => <span className="flex gap-1 flex-wrap"><OrderTags order={o} /></span> },
  { title: 'Placed', dataIndex: 'createdAt', key: 'createdAt', responsive: ['md'], render: (v) => <span className="whitespace-nowrap">{formatDate(v)}</span> },
];

export default function AdminDashboard() {
  usePageTitle('Admin dashboard');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setError('');
    setRefreshing(true);
    return getAdminDashboard().then((r) => setData(r.data)).catch((e) => setError(e.message)).finally(() => setRefreshing(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error && !data) return <div><h1 className="text-4xl mb-6">Dashboard</h1><ErrorMessage title="Could not load the dashboard" message={error} onRetry={load} /></div>;
  if (!data) {
    return (
      <div className="animate-pulse space-y-6" role="status" aria-label="Loading dashboard">
        <div className="h-10 w-48 bg-white" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="surface h-28" />)}</div>
        <div className="surface h-80" />
      </div>
    );
  }

  const { totals, thisMonth, attention: a } = data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-4xl">Dashboard</h1><p className="m-0 mt-1 text-sm text-ink/60">Updated {new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Revenue is money collected on paid orders, including GST.</p></div>
        <Button icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={load} disabled={refreshing}>Refresh</Button>
      </div>
      {error && <ErrorMessage title="Could not refresh" message={error} onRetry={load} />}

      <section aria-label="Needs attention" className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Attention label="Quote requests to review" value={a.quotesToReview} detail={a.quotesToReview ? 'Waiting for your prices' : 'Nothing waiting'} active={a.quotesToReview > 0} to="/admin/quotations?status=requested" />
        <Attention label="Bank transfers to confirm" value={a.awaitingTransfer.count} detail={a.awaitingTransfer.count ? formatCurrency(a.awaitingTransfer.amount) : 'None waiting'} active={a.awaitingTransfer.count > 0} to="/admin/orders?paymentStatus=awaiting_transfer" />
        <Attention label="Paid orders to process" value={a.toProcess} detail={a.toProcess ? 'Confirmed, not yet processing' : 'All caught up'} active={a.toProcess > 0} to="/admin/orders?status=confirmed" />
        <Attention label="Low-stock fabrics" value={a.lowStock} detail={a.lowStock ? `${a.outOfStock} out of stock` : 'Stock levels healthy'} active={a.lowStock > 0} to="/admin/products?lowStock=true" />
      </section>

      <section aria-label="Key figures" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Revenue (all time)" value={formatCurrencyWhole(totals.revenue)} hint={`${formatCurrency(thisMonth.revenue)} so far this month`} change={thisMonth.revenueChangePercent} changeLabel="vs all of last month" />
        <StatCard label="Orders" value={totals.orders} hint={`${totals.paidOrders} paid · ${thisMonth.orders} this month`} />
        <StatCard label="Customers" value={totals.customers} hint={`${totals.newCustomersThisMonth} joined this month · ${totals.staff} staff`} />
        <StatCard label="Products" value={totals.products} hint={totals.draftProducts ? `${totals.draftProducts} draft` : 'All published'} />
      </section>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-6 items-start">
        <Panel title="Monthly sales"><MonthlySalesChart data={data.monthlySales} /></Panel>
        <Panel title="Sales by category"><CategorySalesChart data={data.salesByCategory} /><p className="mt-3 mb-0 text-xs text-ink/60">Item value before GST and shipping, last 12 months.</p></Panel>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-6 items-start">
        <Panel title="Recent orders">
          {data.recentOrders.length === 0 ? <p className="m-0 text-ink/60">No orders yet.</p> : (
            <Table size="small" rowKey="_id" columns={orderColumns} dataSource={data.recentOrders} pagination={false} scroll={{ x: 'max-content' }} />
          )}
        </Panel>
        <div className="space-y-6 min-w-0">
          <Panel title="Top products">
            {data.topProducts.length === 0 ? <p className="m-0 text-ink/60">No paid sales yet.</p> : (
              <ol className="list-none m-0 p-0 divide-y divide-line">
                {data.topProducts.map((p) => (
                  <li key={p.sku} className="py-2 flex justify-between gap-3"><span className="min-w-0"><span className="block text-primary font-semibold truncate">{p.name}</span><span className="text-xs text-ink/60">{p.sku}</span></span><span className="text-right shrink-0"><span className="block">{p.units.toLocaleString('en-IN')} m</span><span className="text-xs text-ink/60">{formatCurrency(p.revenue)}</span></span></li>
                ))}
              </ol>
            )}
            <p className="mt-3 mb-0 text-xs text-ink/60">By metres sold, last 12 months.</p>
          </Panel>
          <Panel title="Low stock">
            {data.lowStockProducts.length === 0 ? <p className="m-0 text-ink/60">Every active fabric is above its threshold.</p> : (
              <ul className="list-none m-0 p-0 divide-y divide-line">
                {data.lowStockProducts.map((p) => (
                  <li key={p.sku} className="py-2 flex items-center justify-between gap-3"><span className="min-w-0"><span className="block text-primary font-semibold truncate">{p.name}</span><span className="text-xs text-ink/60">{p.sku} · alert at {p.threshold} m</span></span>{p.stock <= 0 ? <Tag color="red" className="!m-0">Out of stock</Tag> : <Tag color="gold" className="!m-0">{p.stock} m left</Tag>}</li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
