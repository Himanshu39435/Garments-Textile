import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import ProductForm from '@/components/forms/ProductForm';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { createProduct, listAdminCategories } from '@/services/api/adminApi';

const DEFAULTS = { status: 'draft', moq: 50, stock: 0, lowStockThreshold: 100, gsm: 100, width: 44, gstPercent: 5, colors: [], bulkPricing: [], images: [], specifications: [], tags: [], isBestSeller: false, isNewArrival: false };

export default function AdminAddProduct() {
  usePageTitle('Add product');
  const navigate = useNavigate();
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { listAdminCategories().then((r) => setCategories(r.data)).catch((e) => setError(e.message)); }, []);

  const save = async (payload) => {
    setSaving(true);
    try { await createProduct(payload); message.success('Product created'); navigate('/admin/products'); } finally { setSaving(false); }
  };

  if (error) return <ErrorMessage title="Could not load categories" message={error} />;
  if (!categories) return <LoadingSpinner />;
  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/admin/products" className="inline-flex items-center gap-1"><ArrowLeft size={16} /> All products</Link>
      <h1 className="text-4xl">Add product</h1>
      {categories.length === 0 ? <p>Create a category first, then add products to it. <Link to="/admin/categories">Go to categories</Link></p> : (
        <ProductForm initialValues={DEFAULTS} categories={categories} onSubmit={save} submitting={saving} submitLabel="Create product" onCancel={() => navigate('/admin/products')} />
      )}
    </div>
  );
}
