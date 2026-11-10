import ProductCard from '@/components/product/ProductCard';

const GRID = 'grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6';

function CardSkeleton() {
  return (
    <div className="surface overflow-hidden animate-pulse" aria-hidden="true">
      <div className="aspect-[4/5] bg-secondary" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 bg-secondary" /><div className="h-5 w-3/4 bg-secondary" /><div className="h-3 w-1/2 bg-secondary" /><div className="h-6 w-2/5 bg-secondary" />
      </div>
    </div>
  );
}

/** Responsive product grid with loading skeletons and an empty state. */
export default function ProductGrid({ products, loading = false, skeletonCount = 8, emptyMessage = 'No fabrics match your search yet.', onQuickView, columns = GRID }) {
  if (loading) {
    return <div className={columns} role="status" aria-label="Loading fabrics">{Array.from({ length: skeletonCount }, (_, i) => <CardSkeleton key={i} />)}</div>;
  }
  if (!products?.length) return <p className="surface p-8 text-center text-ink/70">{emptyMessage}</p>;
  return <div className={columns}>{products.map((p) => <ProductCard key={p.slug} product={p} onQuickView={onQuickView} />)}</div>;
}
