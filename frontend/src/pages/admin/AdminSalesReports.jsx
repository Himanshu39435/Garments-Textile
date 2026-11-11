import { useCallback, useEffect, useState } from 'react';
import { Button, DatePicker, Select, Table } from 'antd';
import { Download } from 'lucide-react';
import dayjs from 'dayjs';
import usePageTitle from '@/hooks/usePageTitle';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getAdminSalesReport } from '@/services/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';
import { downloadBlob } from '@/utils/downloadFile';

const GROUPS = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }];
const csvCell = (value) => {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

export default function AdminSalesReports() {
  usePageTitle('Sales reports');
  const [filters, setFilters] = useState({ groupBy: 'daily', from: '', to: '' });
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    getAdminSalesReport(filters)
      .then((response) => setState({ data: response.data, loading: false, error: '' }))
      .catch((error) => setState((current) => ({ ...current, loading: false, error: error.message })));
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const report = state.data;
    if (!report) return;
    const rows = [
      ['Section', 'Name / period', 'Orders / units', 'Revenue (INR)'],
      ...report.sales.map((item) => ['Sales', item.period, item.orders, item.revenue]),
      ...report.products.map((item) => ['Product', item.name, item.units, item.revenue]),
      ...report.categories.map((item) => ['Category', item.category, '', item.revenue]),
      ...report.paymentMethods.map((item) => ['Payment method', item.method, item.orders, '']),
    ];
    downloadBlob(new Blob([`\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), 'narang-textile-sales-report.csv');
  };

  const columns = [
    { title: 'Period', dataIndex: 'period', key: 'period' },
    { title: 'Orders', dataIndex: 'orders', key: 'orders' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right', render: (value) => formatCurrency(value) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl">Sales reports</h1><Button icon={<Download size={16} />} onClick={exportCsv} disabled={!state.data}>Export CSV</Button></div>
      <div className="surface p-4 grid md:grid-cols-3 gap-4">
        <label className="block text-sm">Group by<Select aria-label="Group sales by" className="mt-1 w-full" value={filters.groupBy} options={GROUPS} onChange={(groupBy) => setFilters((current) => ({ ...current, groupBy }))} /></label>
        <label className="block text-sm">From<DatePicker aria-label="Report start date" className="mt-1 w-full" value={filters.from ? dayjs(filters.from) : null} onChange={(value) => setFilters((current) => ({ ...current, from: value?.format('YYYY-MM-DD') ?? '' }))} /></label>
        <label className="block text-sm">To<DatePicker aria-label="Report end date" className="mt-1 w-full" value={filters.to ? dayjs(filters.to) : null} onChange={(value) => setFilters((current) => ({ ...current, to: value?.format('YYYY-MM-DD') ?? '' }))} /></label>
      </div>
      {state.error && <ErrorMessage title="Could not load sales report" message={state.error} onRetry={load} />}
      <section className="grid sm:grid-cols-2 gap-4" aria-label="Sales totals">
        <div className="surface p-5"><p className="m-0 text-sm text-ink/60">Total revenue (paid orders)</p><p className="m-0 mt-1 font-display text-2xl">{formatCurrency(state.data?.totalRevenue ?? 0)}</p></div>
        <div className="surface p-5"><p className="m-0 text-sm text-ink/60">Total orders</p><p className="m-0 mt-1 font-display text-2xl">{state.data?.totalOrders ?? 0}</p></div>
      </section>
      <section className="surface p-5 space-y-6">
        <div><h2 className="text-xl mb-3">{filters.groupBy[0].toUpperCase() + filters.groupBy.slice(1)} sales</h2><Table rowKey="period" columns={columns} dataSource={state.data?.sales ?? []} loading={state.loading} pagination={{ pageSize: 10, hideOnSinglePage: true }} locale={{ emptyText: 'No paid sales for this period.' }} /></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div><h2 className="text-xl mb-3">Product-wise sales</h2><Table size="small" rowKey="sku" pagination={{ pageSize: 5, hideOnSinglePage: true }} dataSource={state.data?.products ?? []} loading={state.loading} columns={[{ title: 'Product', dataIndex: 'name', key: 'name' }, { title: 'Units', dataIndex: 'units', key: 'units' }, { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (value) => formatCurrency(value) }]} locale={{ emptyText: 'No product sales.' }} /></div>
          <div><h2 className="text-xl mb-3">Category-wise sales</h2><Table size="small" rowKey="category" pagination={false} dataSource={state.data?.categories ?? []} loading={state.loading} columns={[{ title: 'Category', dataIndex: 'category', key: 'category' }, { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (value) => formatCurrency(value) }]} locale={{ emptyText: 'No category sales.' }} /></div>
        </div>
        <div><h2 className="text-xl mb-3">Payment method</h2><Table size="small" rowKey="method" pagination={false} dataSource={state.data?.paymentMethods ?? []} loading={state.loading} columns={[{ title: 'Method', dataIndex: 'method', key: 'method', render: (value) => value === 'razorpay' ? 'Razorpay' : 'Bank transfer' }, { title: 'Orders', dataIndex: 'orders', key: 'orders' }]} locale={{ emptyText: 'No payment data.' }} /></div>
      </section>
    </div>
  );
}
