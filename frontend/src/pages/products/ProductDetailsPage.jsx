import { Link, useParams } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import { useProduct } from '@/hooks/useProducts';
import ProductGallery from '@/components/product/ProductGallery';
import WishlistButton from '@/components/product/WishlistButton';
import ProductPrice from '@/components/product/ProductPrice';
import ProductGrid from '@/components/product/ProductGrid';
import BulkPricingTable from '@/components/product/BulkPricingTable';
import BulkPriceCalculator from '@/components/product/BulkPriceCalculator';
import ErrorMessage from '@/components/common/ErrorMessage';
import NotFoundPage from '@/pages/home/NotFoundPage';
import { getLowestBulkPrice } from '@/utils/pricing';

const STOCK_LABEL = {
  in_stock: { text: 'In stock', className: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  low_stock: { text: 'Low stock', className: 'text-amber-800 bg-amber-50 border-amber-200' },
  out_of_stock: { text: 'Out of stock', className: 'text-red-800 bg-red-50 border-red-200' },
};

function DetailsSkeleton() {
  return (
    <div className="container-page py-10 grid md:grid-cols-2 gap-10 animate-pulse" role="status" aria-label="Loading fabric">
      <div className="aspect-[4/5] bg-white border border-line" />
      <div className="space-y-4"><div className="h-4 w-1/3 bg-white" /><div className="h-10 w-3/4 bg-white" /><div className="h-8 w-1/2 bg-white" /><div className="h-40 bg-white" /></div>
    </div>
  );
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const { product, loading, error, notFound, refetch } = useProduct(slug);
  usePageTitle(product?.name ?? 'Fabric');

  if (loading) return <DetailsSkeleton />;
  if (notFound) return <NotFoundPage />;
  if (error) return <div className="container-page py-14"><ErrorMessage title="Could not load this fabric" message={error} onRetry={refetch} /></div>;

  const stock = STOCK_LABEL[product.stockStatus];
  const facts = [
    ['SKU', product.sku], ['Composition', product.composition], ['GSM', product.gsm], ['Width', `${product.width} in`],
    ['MOQ', `${product.moq} ${product.unit}`], ['Available', product.stock > 0 ? `${product.stock} ${product.unit}` : 'None'],
  ];

  return (
    <div className="container-page py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="text-sm text-ink/70 mb-6">
        <Link to="/products" className="text-primary">Fabrics</Link> / <Link to={`/category/${product.category.slug}`} className="text-primary">{product.category.name}</Link> / <span>{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        <ProductGallery images={product.images} swatch={product.swatch} name={product.name} />

        <div className="min-w-0 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl md:text-4xl">{product.name}</h1>
              <WishlistButton productId={product._id} productName={product.name} className="shrink-0" />
            </div>
            <p className="mt-2 mb-0 text-ink/70">{product.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ProductPrice size="lg" price={product.price} moq={product.moq} unit={product.unit} bulkPrice={getLowestBulkPrice(product)} />
            <span className={`text-sm px-2 py-1 border rounded-fabric ${stock.className}`}>{stock.text}</span>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 m-0">
            {facts.map(([label, value]) => (
              <div key={label} className="border-b border-line pb-2"><dt className="text-sm text-ink/60">{label}</dt><dd className="m-0 font-semibold text-primary break-words">{value}</dd></div>
            ))}
          </dl>

          {product.colors?.length > 0 && (
            <div>
              <h2 className="text-lg mb-2">Colours</h2>
              <ul className="flex flex-wrap gap-3 list-none m-0 p-0">
                {product.colors.map((c) => (
                  <li key={c.name} className="flex items-center gap-2 text-sm"><span className="h-6 w-6 rounded-full border border-line" style={{ background: c.hex }} aria-hidden="true" />{c.name}</li>
                ))}
              </ul>
            </div>
          )}

          {product.bulkPricing?.length > 0 && (
            <div><h2 className="text-lg mb-2">Bulk pricing</h2><BulkPricingTable product={product} /></div>
          )}

          {product.stock > 0 && <BulkPriceCalculator product={product} />}

          <div className="flex flex-wrap gap-3">
            <Link to={`/quote?product=${product.slug}`} className="btn-primary no-underline">Request a quote</Link>
            <Link to="/contact" className="btn-outline no-underline">Ask about samples</Link>
          </div>
        </div>
      </div>

      {product.specifications?.length > 0 && (
        <section className="mt-16" aria-labelledby="specs">
          <h2 id="specs" className="text-2xl mb-4">Specifications</h2>
          <div className="table-scroll border border-line bg-white max-w-3xl">
            <table className="w-full text-left border-collapse">
              <tbody>
                {product.specifications.map((s) => (
                  <tr key={s.label} className="border-b border-line last:border-b-0"><th scope="row" className="p-3 w-1/3 font-semibold text-primary bg-secondary">{s.label}</th><td className="p-3">{s.value}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {product.related?.length > 0 && (
        <section className="mt-16" aria-labelledby="related">
          <h2 id="related" className="text-2xl mb-6">More {product.category.name.toLowerCase()}</h2>
          <ProductGrid products={product.related} />
        </section>
      )}
    </div>
  );
}
