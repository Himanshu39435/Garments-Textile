import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import ProductForm from '@/components/forms/ProductForm';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getAdminProduct, listAdminCategories, updateProduct } from '@/services/api/adminApi';

export default function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [state, setState] = useState({ product: null, categories: null, error: '' });
  const [saving, setSaving] = useState(false);
  usePageTitle(state.product ? `Edit ${state.product.name}` : 'Edit product');

  useEffect(() => {
    Promise.all([getAdminProduct(id), listAdminCategories()])
      .then(([p, c]) => setState({ product: p.data, categories: c.data, error: '' }))
      .catch((e) => setState({ product: null, categories: null, error: e.message }));
  }, [id]);

  const save = async (payload) => {
    setSaving(true);
    try {
      const { data } = await updateProduct(id, payload);
      setState((s) => ({ ...s, product: data }));
      message.success('Product saved');
    } finally { setSaving(false); }
  };

  if (state.error) return <ErrorMessage title="Could not load this product" message={state.error} />;
  if (!state.product) return <LoadingSpinner />;
  const p = state.product;
  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/admin/products" className="inline-flex items-center gap-1"><ArrowLeft size={16} /> All products</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-4xl">Edit product</h1><p className="m-0 mt-1 text-ink/60">{p.name} · {p.sku}</p></div>
        {p.status === 'active' && <Link to={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer">View on store</Link>}
      </div>
      <ProductForm key={p.updatedAt} initialValues={p} categories={state.categories} onSubmit={save} submitting={saving} submitLabel="Save changes" onCancel={() => navigate('/admin/products')} />
    </div>
  );
}
