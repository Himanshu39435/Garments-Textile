import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import FabricSwatch from '@/components/common/FabricSwatch';
import ProductPrice from '@/components/product/ProductPrice';
import WishlistButton from '@/components/product/WishlistButton';
import { getLowestBulkPrice } from '@/utils/pricing';

/** Catalogue card. Uses the first uploaded image, else the generated swatch. */
export default function ProductCard({ product, onQuickView }) {
  const { _id, slug, name, category, gsm, width, price, moq, unit = 'm', swatch, images = [], colors = [], isBestSeller, isNewArrival, stockStatus } = product;
  const badge = stockStatus === 'out_of_stock' ? 'Out of stock' : isBestSeller ? 'Best seller' : isNewArrival ? 'New' : null;

  return (
    <article className="surface group overflow-hidden flex flex-col h-full">
      <div className="relative">
        <Link to={`/products/${slug}`} className="block no-underline" aria-label={`View ${name}`}>
          <div className="aspect-[4/5] bg-secondary p-5">
            {images[0] ? (
              <img src={images[0].url} alt={images[0].alt || name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <FabricSwatch swatch={swatch} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" />
            )}
          </div>
        </Link>
        {badge && <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-fabric">{badge}</span>}
        <WishlistButton productId={_id} productName={name} className="absolute top-3 right-3" />
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute bottom-3 right-3 btn bg-white text-primary border-line !px-3 !py-2 text-sm shadow-card cursor-pointer md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 transition-opacity"
            aria-label={`Quick view ${name}`}
          >
            <Eye size={16} /> Quick view
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="m-0 text-sm text-ink/60">{category?.name}</p>
        <h3 className="text-lg"><Link to={`/products/${slug}`} className="text-primary no-underline hover:text-accent-dark">{name}</Link></h3>
        <p className="m-0 text-sm text-ink/70">{unit === 'piece' ? 'Ready-to-wear wholesale garment' : `${gsm} GSM · ${width} in wide`}</p>
        <div className="flex gap-1.5" aria-label="Available colours">
          {colors.map((c) => <span key={c.name} title={c.name} className="h-4 w-4 rounded-full border border-line" style={{ background: c.hex }} />)}
        </div>
        <div className="mt-auto pt-2"><ProductPrice price={price} unit={unit} bulkPrice={getLowestBulkPrice(product)} moq={moq} /></div>
      </div>
    </article>
  );
}
