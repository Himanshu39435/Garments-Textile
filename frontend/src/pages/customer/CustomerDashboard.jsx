import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from 'antd';
import { ArrowRight, Heart, MapPin, Package, ShoppingBag, Wallet } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import useAuth from '@/hooks/useAuth';
import { OrderStatusTag } from '@/components/order/OrderStatusTag';
import QuotationStatusTag from '@/components/quotation/QuotationStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getDashboard } from '@/services/api/customerApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const Stat = ({ label, value, to, icon: Icon }) => (
  <Link to={to} className="surface p-5 no-underline block hover:shadow-lift transition-shadow">
    <div className="flex items-center justify-between gap-3">
      <Icon size={22} className="text-accent-dark" aria-hidden="true" />
      <ArrowRight size={16} className="text-ink/40" aria-hidden="true" />
    </div>
    <p className="mt-4 mb-0 font-display text-3xl text-primary">{value}</p>
    <p className="m-0 text-sm text-ink/70">{label}</p>
  </Link>
);

export default function CustomerDashboard() {
  usePageTitle('My account');
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const load = () => { setError(''); getDashboard().then((r) => setSummary(r.data)).catch((e) => setError(e.message)); };
  useEffect(load, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 text-sm uppercase tracking-[.16em] text-ink/60">My account</p>
          <h1 className="mt-2 text-4xl md:text-5xl">Welcome, {user.name.split(' ')[0]}</h1>
          {user.business?.companyName && <p className="mt-2 mb-0 text-ink/70">{user.business.companyName}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/products" className="btn-primary no-underline"><ShoppingBag size={17} aria-hidden="true" />Continue shopping</Link>
          <Link to="/account/orders" className="btn-outline no-underline">My orders</Link>
        </div>
      </div>

      {error && <ErrorMessage title="Could not load your dashboard" message={error} onRetry={load} />}
      {!summary && !error && <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse" role="status" aria-label="Loading dashboard">{[0, 1, 2, 3].map((i) => <div key={i} className="surface h-24" />)}</div>}

      {summary && (
        <>
          {summary.awaitingPayment > 0 && (
            <Alert type="warning" showIcon message={`${summary.awaitingPayment} ${summary.awaitingPayment === 1 ? 'order is' : 'orders are'} waiting for payment`} action={<Link to="/account/orders?status=pending">Review</Link>} />
          )}
          {summary.quotations.readyToOrder > 0 && (
            <Alert type="success" showIcon message={`${summary.quotations.readyToOrder} ${summary.quotations.readyToOrder === 1 ? 'quotation is' : 'quotations are'} ready to order`} action={<Link to="/account/quotations">View</Link>} />
          )}
          <section aria-label="Summary" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Stat label="Total orders" value={summary.totalOrders} to="/account/orders" icon={Package} />
            <Stat label="Active orders" value={summary.openOrders} to="/account/orders" icon={ShoppingBag} />
            <Stat label="Total spent" value={formatCurrency(summary.totalSpent)} to="/account/orders" icon={Wallet} />
            <Stat label="Quotations awaiting reply" value={summary.quotations.awaitingReply} to="/account/quotations" icon={ArrowRight} />
            <Stat label="Saved fabrics" value={summary.wishlistCount} to="/account/wishlist" icon={Heart} />
            <Stat label="Saved addresses" value="View" to="/account/addresses" icon={MapPin} />
          </section>

          <section aria-labelledby="recent">
            <div className="flex items-end justify-between gap-3 mb-3"><h2 id="recent" className="text-2xl">Recent orders</h2>{summary.totalOrders > 0 && <Link to="/account/orders">View all</Link>}</div>
            {summary.recentOrders.length === 0 ? (
              <div className="surface p-8 text-center"><p className="mt-0 text-ink/70">You have not placed an order yet.</p><Link to="/products" className="btn-primary no-underline">Browse fabrics</Link></div>
            ) : (
              <ul className="list-none m-0 p-0 space-y-3">
                {summary.recentOrders.map((o) => (
                  <li key={o._id}>
                    <Link to={`/account/orders/${o._id}`} className="surface p-4 flex flex-wrap items-center justify-between gap-3 no-underline hover:shadow-lift transition-shadow">
                      <span className="min-w-0"><strong className="text-primary">{o.orderNumber}</strong><span className="block text-sm text-ink/70">{formatDate(o.createdAt)} · {o.items.map((i) => i.name).slice(0, 2).join(', ')}{o.items.length > 2 ? ` +${o.items.length - 2}` : ''}</span></span>
                      <span className="flex items-center gap-3"><OrderStatusTag status={o.status} /><strong className="text-primary">{formatCurrency(o.pricing.total)}</strong></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="recent-quotes">
            <div className="flex items-end justify-between gap-3 mb-3"><h2 id="recent-quotes" className="text-2xl">Recent quotations</h2>{summary.quotations.total > 0 && <Link to="/account/quotations">View all</Link>}</div>
            {summary.quotations.recent.length === 0 ? (
              <div className="surface p-8 text-center"><p className="mt-0 text-ink/70">Buying in bulk? Ask for a quote and we will price your quantity.</p><Link to="/quote" className="btn-primary no-underline">Request a quote</Link></div>
            ) : (
              <ul className="list-none m-0 p-0 space-y-3">
                {summary.quotations.recent.map((q) => (
                  <li key={q._id}>
                    <Link to={`/account/quotations/${q._id}`} className="surface p-4 flex flex-wrap items-center justify-between gap-3 no-underline hover:shadow-lift transition-shadow">
                      <span className="min-w-0"><strong className="text-primary">{q.quoteNumber}</strong><span className="block text-sm text-ink/70">{formatDate(q.createdAt)} · {q.items.map((i) => i.name).slice(0, 2).join(', ')}{q.items.length > 2 ? ` +${q.items.length - 2}` : ''}</span></span>
                      <span className="flex items-center gap-3">{q.status === 'approved' && q.validUntil && <span className="text-sm text-ink/60">Valid until {formatDate(q.validUntil)}</span>}<QuotationStatusTag status={q.status} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
