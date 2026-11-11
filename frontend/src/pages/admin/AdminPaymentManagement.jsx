import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Select, Table, Tag } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import ErrorMessage from '@/components/common/ErrorMessage';
import { listAdminPayments } from '@/services/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const METHOD = [{ value: '', label: 'All methods' }, { value: 'razorpay', label: 'Razorpay' }, { value: 'bank_transfer', label: 'Bank transfer' }];
const STATUS = [{ value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'awaiting_transfer', label: 'Awaiting transfer' }, { value: 'paid', label: 'Paid' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }];
const STATUS_COLOR = { paid: 'green', refunded: 'purple', failed: 'red', awaiting_transfer: 'gold', pending: 'orange' };

export default function AdminPaymentManagement() {
  usePageTitle('Payments');
  const [filters, setFilters] = useState({ method: '', status: '' });
  const [state, setState] = useState({ rows: [], loading: true, error: '' });

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    listAdminPayments(filters)
      .then((response) => setState({ rows: response.data, loading: false, error: '' }))
      .catch((error) => setState((current) => ({ ...current, loading: false, error: error.message })));
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: 'Order', key: 'order', render: (_, row) => <Link className="font-semibold whitespace-nowrap" to={`/admin/orders/${row._id}`}>{row.orderNumber}</Link> },
    { title: 'Customer', dataIndex: ['customer', 'name'], key: 'customer' },
    { title: 'Method', dataIndex: 'paymentMethod', key: 'method', render: (value) => value === 'razorpay' ? 'Razorpay' : 'Bank transfer' },
    { title: 'Amount', dataIndex: ['pricing', 'total'], key: 'amount', render: (value) => formatCurrency(value) },
    { title: 'Status', dataIndex: 'paymentStatus', key: 'status', render: (value) => <Tag color={STATUS_COLOR[value]}>{value.replaceAll('_', ' ')}</Tag> },
    { title: 'Transaction ID', dataIndex: 'transactionId', key: 'transaction', render: (value) => value || '—' },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', responsive: ['md'], render: (value) => formatDate(value) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Payments</h1>
      <div className="surface p-4 flex flex-wrap gap-3">
        <Select aria-label="Filter payment method" value={filters.method} options={METHOD} onChange={(method) => setFilters((current) => ({ ...current, method }))} style={{ width: 180 }} />
        <Select aria-label="Filter payment status" value={filters.status} options={STATUS} onChange={(status) => setFilters((current) => ({ ...current, status }))} style={{ width: 190 }} />
      </div>
      {state.error ? <ErrorMessage title="Could not load payments" message={state.error} onRetry={load} /> : (
        <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} scroll={{ x: 'max-content' }} pagination={{ pageSize: 15, hideOnSinglePage: true }} locale={{ emptyText: 'No payments match these filters.' }} />
      )}
      <p className="m-0 text-sm text-ink/60">Online payments are verified by Razorpay. Bank transfers are confirmed from the order details page.</p>
    </div>
  );
}
