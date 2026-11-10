import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Checkbox, Input, Popconfirm, Select, Table, Tag, message } from 'antd';
import { Plus } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import FabricSwatch from '@/components/common/FabricSwatch';
import ErrorMessage from '@/components/common/ErrorMessage';
import { deleteProduct, listAdminCategories, listAdminProducts } from '@/services/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';

const PAGE_SIZE = 15;
const STATUS_TAG = { active: ['Active', 'green'], draft: ['Draft', 'gold'], archived: ['Archived', 'default'] };

export default function AdminProductManagement() {
  usePageTitle('Products');
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const category = params.get('category') ?? '';
  const lowStock = params.get('lowStock') === 'true';
  const page = Number(params.get('page')) || 1;

  const [state, setState] = useState({ rows: [], meta: null, loading: true, error: '' });
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState(search);

  useEffect(() => { listAdminCategories().then((r) => setCategories(r.data)).catch(() => {}); }, []);
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    listAdminProducts({ search, status, category, lowStock: lowStock || undefined, page, limit: PAGE_SIZE })
      .then((r) => setState({ rows: r.data, meta: r.meta, loading: false, error: '' }))
      .catch((e) => setState((s) => ({ ...s, loading: false, error: e.message })));
  }, [search, status, category, lowStock, page]);
  useEffect(load, [load]);

  const update = (patch) => { const next = new URLSearchParams(params); Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k))); if (!('page' in patch)) next.delete('page'); setParams(next); };
  const remove = async (p) => { try { const r = await deleteProduct(p._id); message.success(r.message); load(); } catch (e) { message.error(e.message); } };

  const columns = [
    { title: '', key: 'img', width: 56, render: (_, p) => <div className="h-12 w-12 bg-secondary">{p.images?.[0] ? <img src={p.images[0].url} alt="" className="h-full w-full object-cover" /> : p.swatch ? <FabricSwatch swatch={p.swatch} className="h-full w-full" depth={2} /> : null}</div> },
    { title: 'Product', key: 'name', render: (_, p) => <span><Link to={`/admin/products/${p._id}/edit`} className="font-semibold">{p.name}</Link><span className="block text-xs text-ink/60">{p.sku}</span></span> },
    { title: 'Category', key: 'category', responsive: ['md'], render: (_, p) => p.category?.name },
    { title: 'Price / m', key: 'price', align: 'right', render: (_, p) => <span className="whitespace-nowrap">{formatCurrency(p.price)}</span> },
    { title: 'Stock', key: 'stock', align: 'right', render: (_, p) => <span className="whitespace-nowrap">{p.stock} m {p.stockStatus === 'out_of_stock' ? <Tag color="red" className="!ml-1 !mr-0">Out</Tag> : p.stockStatus === 'low_stock' ? <Tag color="gold" className="!ml-1 !mr-0">Low</Tag> : null}</span> },
    { title: 'Status', key: 'status', render: (_, p) => <Tag color={STATUS_TAG[p.status][1]} className="!m-0">{STATUS_TAG[p.status][0]}</Tag> },
    { title: 'Actions', key: 'actions', render: (_, p) => (
      <span className="flex gap-2 whitespace-nowrap">
        <Link to={`/admin/products/${p._id}/edit`} className="btn-outline !py-1 !px-3 text-sm no-underline">Edit</Link>
        <Popconfirm title="Delete this product?" description="If it appears in past orders it is archived instead." okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => remove(p)}><Button danger size="small">Delete</Button></Popconfirm>
      </span>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Products</h1>
        <Link to="/admin/products/new" className="btn-primary no-underline"><Plus size={16} /> Add product</Link>
      </div>
      <div className="surface p-4 flex flex-wrap items-center gap-3">
        <Input.Search aria-label="Search products" placeholder="Search name, SKU or slug" allowClear value={searchText} onChange={(e) => setSearchText(e.target.value)} onSearch={(v) => update({ search: v.trim() })} style={{ maxWidth: 300 }} />
        <Select aria-label="Filter by status" value={status} onChange={(v) => update({ status: v })} style={{ width: 150 }} options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }]} />
        <Select aria-label="Filter by category" value={category} onChange={(v) => update({ category: v })} style={{ width: 190 }} options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]} />
        <Checkbox checked={lowStock} onChange={(e) => update({ lowStock: e.target.checked ? 'true' : '' })}>Low stock only</Checkbox>
      </div>
      {state.error ? <ErrorMessage title="Could not load products" message={state.error} onRetry={load} /> : (
        <Table rowKey="_id" columns={columns} dataSource={state.rows} loading={state.loading} scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No products match these filters.' }}
          pagination={{ current: page, pageSize: PAGE_SIZE, total: state.meta?.total ?? 0, showSizeChanger: false, hideOnSinglePage: true, onChange: (p) => update({ page: p > 1 ? String(p) : '' }) }} />
      )}
    </div>
  );
}
