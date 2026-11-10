import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Input, Popconfirm, Table, Tag, message } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import usePanelPaths from '@/hooks/usePanelPaths';
import ErrorMessage from '@/components/common/ErrorMessage';
import { listAdminCustomers, setCustomerActive } from '@/services/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const PAGE_SIZE = 15;

export default function AdminCustomerManagement() {
  usePageTitle('Customers');
  const { base } = usePanelPaths();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const page = Number(params.get('page')) || 1;
  const [searchText, setSearchText] = useState(search);
  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listAdminCustomers({ search, page, limit: PAGE_SIZE }).then((r) => setState({ rows: r.data, meta: r.meta, loading: false, error: '' })).catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  }, [search, page]);
  useEffect(load, [load]);
  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); if (!('page' in patch)) next.delete('page'); setParams(next); };
  const toggle = async (customer) => {
    try {
      const response = await setCustomerActive(customer._id, !customer.isActive);
      message.success(response.message);
      load();
    } catch (e) {
      message.error(e.message);
    }
  };

  const columns = [
    { title: 'Customer', key: 'name', render: (_, u) => <span><Link to={`${base}/customers/${u._id}`} className="font-semibold">{u.name}</Link><span className="block text-xs text-ink/60">{u.business?.companyName ?? 'No company'}</span></span> },
    { title: 'Contact', key: 'contact', responsive: ['md'], render: (_, u) => <span>{u.email}<span className="block text-xs text-ink/60">{u.phone}</span></span> },
    { title: 'GSTIN', key: 'gstin', responsive: ['lg'], render: (_, u) => u.business?.gstin ?? <span className="text-ink/40">—</span> },
    { title: 'Orders', dataIndex: 'orderCount', key: 'orders', align: 'right' },
    { title: 'Total paid', key: 'paid', align: 'right', render: (_, u) => <span className="whitespace-nowrap">{formatCurrency(u.totalPaid)}</span> },
    { title: 'Joined', dataIndex: 'createdAt', key: 'joined', responsive: ['lg'], render: (v) => <span className="whitespace-nowrap">{formatDate(v)}</span> },
    { title: 'Status', key: 'status', render: (_, u) => (u.isActive ? <Tag color="green" className="!m-0">Active</Tag> : <Tag color="red" className="!m-0">Deactivated</Tag>) },
    { title: '', key: 'actions', render: (_, u) => (
      <Popconfirm
        title={u.isActive ? 'Deactivate this customer?' : 'Reactivate this customer?'}
        description={u.isActive ? 'They will be signed out and cannot log in until reactivated. Their order history will be kept.' : undefined}
        okText={u.isActive ? 'Deactivate' : 'Reactivate'}
        okButtonProps={{ danger: u.isActive }}
        onConfirm={() => toggle(u)}
      >
        <Button size="small" danger={u.isActive}>{u.isActive ? 'Deactivate' : 'Reactivate'}</Button>
      </Popconfirm>
    ) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Customers</h1>
      <div className="surface p-4"><Input.Search aria-label="Search customers" placeholder="Search name, email, phone, company or GSTIN" allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} onSearch={(v) => update({ search: v.trim() })} style={{ maxWidth: 420 }} /></div>
      {state.error ? <ErrorMessage title="Could not load customers" message={state.error} onRetry={load} /> : (
        <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} scroll={{ x: 'max-content' }} locale={{ emptyText: 'No customers match this search.' }}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: state.meta?.total ?? 0, showSizeChanger: false, hideOnSinglePage: true, onChange: (p) => update({ page: p > 1 ? String(p) : '' }) }} />
      )}
    </div>
  );
}
