import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input, Select, Table } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import usePanelPaths from '@/hooks/usePanelPaths';
import QuotationStatusTag from '@/components/quotation/QuotationStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import { listAdminQuotations } from '@/services/api/adminApi';
import { formatDate } from '@/utils/formatDate';

const PAGE_SIZE = 15;
const STATUS = [['', 'All statuses'], ['requested', 'Awaiting quote'], ['approved', 'Quote ready'], ['converted', 'Ordered'], ['expired', 'Expired'], ['rejected', 'Declined'], ['cancelled', 'Cancelled']].map(([value, label]) => ({ value, label }));

export default function AdminQuotationManagement() {
  usePageTitle('Quotations');
  const { base } = usePanelPaths();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const page = Number(params.get('page')) || 1;
  const [searchText, setSearchText] = useState(search);
  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listAdminQuotations({ search, status, page, limit: PAGE_SIZE }).then((r) => setState({ rows: r.data, meta: r.meta, loading: false, error: '' })).catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  }, [search, status, page]);
  useEffect(load, [load]);
  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); if (!('page' in patch)) next.delete('page'); setParams(next); };

  const columns = [
    { title: 'Quotation', key: 'no', render: (_, q) => <Link to={`${base}/quotations/${q._id}`} className="font-semibold whitespace-nowrap">{q.quoteNumber}</Link> },
    { title: 'Customer', key: 'customer', render: (_, q) => <span>{q.customer?.name}{q.customer?.companyName ? <span className="block text-xs text-ink/60">{q.customer.companyName}</span> : null}</span> },
    { title: 'Items', key: 'items', responsive: ['md'], render: (_, q) => <span className="text-sm">{q.items.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}</span> },
    { title: 'Requested', dataIndex: 'createdAt', key: 'createdAt', responsive: ['md'], render: (v) => <span className="whitespace-nowrap">{formatDate(v)}</span> },
    { title: 'Valid until', dataIndex: 'validUntil', key: 'validUntil', responsive: ['lg'], render: (v) => (v ? formatDate(v) : <span className="text-ink/40">—</span>) },
    { title: 'Status', key: 'status', render: (_, q) => <QuotationStatusTag status={q.status} /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Quotations</h1>
      <div className="surface p-4 flex flex-wrap items-center gap-3">
        <Input.Search aria-label="Search quotations" placeholder="Quote no., customer, email, company" allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} onSearch={(v) => update({ search: v.trim() })} style={{ maxWidth: 320 }} />
        <Select aria-label="Filter by status" value={status} onChange={(v) => update({ status: v })} options={STATUS} style={{ width: 180 }} />
      </div>
      {state.error ? <ErrorMessage title="Could not load quotations" message={state.error} onRetry={load} /> : (
        <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'No quotations match these filters.' }}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: state.meta?.total ?? 0, showSizeChanger: false, hideOnSinglePage: true, onChange: (p) => update({ page: p > 1 ? String(p) : '' }) }} />
      )}
    </div>
  );
}
