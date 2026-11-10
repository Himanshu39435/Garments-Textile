import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Popconfirm, Table, Tag, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import usePanelPaths from '@/hooks/usePanelPaths';
import { OrderTags } from '@/components/order/OrderStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getAdminCustomer, setCustomerActive } from '@/services/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const Stat = ({ label, value }) => <div className="surface p-4"><p className="m-0 font-display text-2xl text-primary">{value}</p><p className="m-0 text-sm text-ink/70">{label}</p></div>;

export default function AdminCustomerDetails() {
  const { id } = useParams();
  const { base, isAdmin } = usePanelPaths();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(c ? c.name : 'Customer');
  const load = useCallback(() => getAdminCustomer(id).then((r) => setC(r.data)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorMessage title="Could not load this customer" message={error} onRetry={() => { setError(''); load(); }} />;
  if (!c) return <LoadingSpinner />;

  const toggle = async () => { try { const r = await setCustomerActive(c._id, !c.isActive); message.success(r.message); load(); } catch (e) { message.error(e.message); } };
  const b = c.business ?? {};

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to={`${base}/customers`} className="inline-flex items-center gap-1"><ArrowLeft size={16} /> All customers</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl md:text-4xl">{c.name}</h1><p className="mt-1 mb-0 text-ink/70">Customer since {formatDate(c.createdAt)}{c.lastLoginAt ? ` · last sign-in ${formatDate(c.lastLoginAt)}` : ''}</p></div>
        <div className="flex items-center gap-3">
          {c.isActive ? <Tag color="green" className="!m-0">Active</Tag> : <Tag color="red" className="!m-0">Deactivated</Tag>}
          {isAdmin && <Popconfirm title={c.isActive ? 'Deactivate this customer?' : 'Reactivate this customer?'} description={c.isActive ? 'They are signed out and cannot log in until reactivated. Order history is kept.' : undefined} okText={c.isActive ? 'Deactivate' : 'Reactivate'} okButtonProps={{ danger: c.isActive }} onConfirm={toggle}>
            <Button danger={c.isActive}>{c.isActive ? 'Deactivate' : 'Reactivate'}</Button>
          </Popconfirm>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md"><Stat label="Orders" value={c.stats.orderCount} /><Stat label="Total paid" value={formatCurrency(c.stats.totalPaid)} /></div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="surface p-5 min-w-0 break-words" aria-labelledby="contact"><h2 id="contact" className="text-lg mb-2">Contact</h2>
          <p className="m-0"><a href={`mailto:${c.email}`}>{c.email}</a>{c.isEmailVerified ? '' : ' (not verified)'}<br />{c.phone}</p></section>
        <section className="surface p-5 min-w-0 break-words" aria-labelledby="biz"><h2 id="biz" className="text-lg mb-2">Business</h2>
          <p className="m-0">{b.companyName ?? <span className="text-ink/60">No company name</span>}{b.businessType ? ` · ${b.businessType}` : ''}<br />GSTIN: {b.gstin ? <strong>{b.gstin}</strong> : <span className="text-ink/60">not provided</span>}</p></section>
      </div>

      <section className="surface p-5" aria-labelledby="addr"><h2 id="addr" className="text-xl mb-3">Addresses</h2>
        {c.addresses.length === 0 ? <p className="m-0 text-ink/60">No saved addresses.</p> : (
          <ul className="list-none m-0 p-0 grid md:grid-cols-2 gap-3">{c.addresses.map((a) => (
            <li key={a._id} className="border border-line p-3 min-w-0 break-words"><strong className="text-primary">{a.fullName}{a.label ? ` · ${a.label}` : ''}</strong>{a.isDefault && <Tag color="gold" className="!ml-2">Default</Tag>}
              <p className="m-0 mt-1 text-ink/80">{[a.line1, a.line2].filter(Boolean).join(', ')}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p></li>
          ))}</ul>
        )}
      </section>

      <section className="surface p-5" aria-labelledby="orders-h"><h2 id="orders-h" className="text-xl mb-3">Order history</h2>
        <Table size="small" rowKey="_id" pagination={false} dataSource={c.orders} scroll={{ x: 'max-content' }} locale={{ emptyText: 'No orders yet.' }}
          columns={[
            { title: 'Order', key: 'no', render: (_, o) => <Link to={`${base}/orders/${o._id}`} className="font-semibold">{o.orderNumber}</Link> },
            { title: 'Placed', dataIndex: 'createdAt', render: formatDate },
            { title: 'Total', key: 't', align: 'right', render: (_, o) => formatCurrency(o.pricing.total) },
            { title: 'Status', key: 's', render: (_, o) => <span className="flex gap-1 flex-wrap"><OrderTags order={o} /></span> },
          ]} />
      </section>
    </div>
  );
}
