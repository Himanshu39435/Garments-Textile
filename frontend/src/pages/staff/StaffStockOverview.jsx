import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Checkbox, Input, Table, Tag } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import FabricSwatch from '@/components/common/FabricSwatch';
import ErrorMessage from '@/components/common/ErrorMessage';
import { listAdminProducts } from '@/services/api/adminApi';

const PAGE_SIZE = 15;

/** Read-only stock list for staff: what is on the shelf and what is running low. Editing products is admin only. */
export default function StaffStockOverview() {
  usePageTitle('Stock');
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const lowStock = params.get('lowStock') === 'true';
  const page = Number(params.get('page')) || 1;
  const [searchText, setSearchText] = useState(search);
  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listAdminProducts({ search, status: 'active', lowStock: lowStock || undefined, page, limit: PAGE_SIZE })
      .then((r) => setState({ rows: r.data, meta: r.meta, loading: false, error: '' }))
      .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  }, [search, lowStock, page]);
  useEffect(load, [load]);

  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); if (!('page' in patch)) next.delete('page'); setParams(next); };

  const columns = [
    { title: '', key: 'img', width: 56, render: (_, p) => <div className="h-12 w-12 bg-secondary">{p.images?.[0] ? <img src={p.images[0].url} alt="" className="h-full w-full object-cover" /> : p.swatch ? <FabricSwatch swatch={p.swatch} className="h-full w-full" depth={2} /> : null}</div> },
    { title: 'Fabric', key: 'name', render: (_, p) => <span><strong className="text-primary">{p.name}</strong><span className="block text-xs text-ink/60">{p.sku}</span></span> },
    { title: 'Category', key: 'category', responsive: ['md'], render: (_, p) => p.category?.name },
    { title: 'MOQ', key: 'moq', align: 'right', responsive: ['md'], render: (_, p) => <span className="whitespace-nowrap">{p.moq} m</span> },
    { title: 'In stock', key: 'stock', align: 'right', render: (_, p) => <span className="whitespace-nowrap">{p.stock} m {p.stockStatus === 'out_of_stock' ? <Tag color="red" className="!ml-1 !mr-0">Out</Tag> : p.stockStatus === 'low_stock' ? <Tag color="gold" className="!ml-1 !mr-0">Low</Tag> : null}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-4xl">Stock</h1><p className="m-0 mt-1 text-sm text-ink/60">Active fabrics only. To change stock levels or products, ask an admin.</p></div>
      <div className="surface p-4 flex flex-wrap items-center gap-3">
        <Input.Search aria-label="Search fabrics" placeholder="Search name or SKU" allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} onSearch={(v) => update({ search: v.trim() })} style={{ maxWidth: 300 }} />
        <Checkbox checked={lowStock} onChange={(e) => update({ lowStock: e.target.checked ? 'true' : '' })}>Low stock only</Checkbox>
      </div>
      {state.error ? <ErrorMessage title="Could not load stock" message={state.error} onRetry={load} /> : (
        <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No fabrics match these filters.' }}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: state.meta?.total ?? 0, showSizeChanger: false, hideOnSinglePage: true, onChange: (p) => update({ page: p > 1 ? String(p) : '' }) }} />
      )}
    </div>
  );
}
