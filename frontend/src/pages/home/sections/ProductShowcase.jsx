import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Segmented } from 'antd';
import ProductGrid from '@/components/product/ProductGrid';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useProducts } from '@/hooks/useProducts';

/** Best sellers / new arrivals pulled from the live catalogue. */
export default function ProductShowcase() {
  const [tab, setTab] = useState('best');
  const { products, loading, error, refetch } = useProducts({ flag: tab, limit: 4, sort: 'popular' });

  return (
    <section className="container-page pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h2 className="text-3xl md:text-4xl">What buyers are ordering</h2>
        <Segmented value={tab} onChange={setTab} options={[{ label: 'Best sellers', value: 'best' }, { label: 'New arrivals', value: 'new' }]} />
      </div>
      {error ? (
        <ErrorMessage title="Could not load fabrics" message={error} onRetry={refetch} />
      ) : (
        <ProductGrid products={products} loading={loading} skeletonCount={4} emptyMessage="Our catalogue is being updated. Check back shortly." />
      )}
      <p className="mt-6 mb-0"><Link to="/products" className="text-primary font-semibold">Browse the full catalogue</Link></p>
    </section>
  );
}
