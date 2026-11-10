import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Segmented } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import QuotationStatusTag from '@/components/quotation/QuotationStatusTag';
import Pagination from '@/components/common/Pagination';
import ErrorMessage from '@/components/common/ErrorMessage';
import { listQuotations } from '@/services/api/quotationApi';
import { formatDate } from '@/utils/formatDate';

const PAGE_SIZE = 8;
const FILTERS = [['', 'All'], ['requested', 'Awaiting quote'], ['approved', 'Quote ready'], ['converted', 'Ordered'], ['expired', 'Expired'], ['rejected', 'Declined'], ['cancelled', 'Cancelled']];

export default function CustomerQuotations() {
  usePageTitle('My quotations');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Number(params.get('page')) || 1;
  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listQuotations({ status: status || undefined, page, limit: PAGE_SIZE }).then((r) => setState({ rows: r.data, meta: r.meta, loading: false, error: '' })).catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  };
  useEffect(load, [status, page]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); setParams(next); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl">My quotations</h1><Link to="/quote" className="btn-primary no-underline">New quote request</Link></div>
      <div className="overflow-x-auto pb-1"><Segmented value={status} onChange={(v) => update({ status: v, page: '' })} options={FILTERS.map(([value, label]) => ({ value, label }))} aria-label="Filter by status" /></div>

      {state.error ? <ErrorMessage title="Could not load quotations" message={state.error} onRetry={load} /> : state.loading ? (
        <div className="space-y-3 animate-pulse" role="status" aria-label="Loading quotations">{[0, 1, 2].map((i) => <div key={i} className="surface h-24" />)}</div>
      ) : state.rows.length === 0 ? (
        <div className="surface p-10 text-center">
          <p className="mt-0 text-ink/70">{status ? 'No quotations with this status.' : 'You have not requested a quote yet. Ask for special pricing on bulk quantities.'}</p>
          {status ? <button type="button" className="btn-outline" onClick={() => update({ status: '', page: '' })}>Show all</button> : <Link to="/quote" className="btn-primary no-underline">Request a quote</Link>}
        </div>
      ) : (
        <>
          <ul className="list-none m-0 p-0 space-y-3">
            {state.rows.map((q) => (
              <li key={q._id}>
                <Link to={`/account/quotations/${q._id}`} className="surface p-4 md:p-5 block no-underline hover:shadow-lift transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><strong className="text-primary text-lg">{q.quoteNumber}</strong><span className="block text-sm text-ink/70">Requested {formatDate(q.createdAt)}</span></div><QuotationStatusTag status={q.status} /></div>
                  <p className="my-2 text-sm text-ink/75">{q.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}</p>
                  {q.status === 'approved' && q.validUntil && <p className="m-0 text-sm text-accent-dark">Valid until {formatDate(q.validUntil)}</p>}
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
