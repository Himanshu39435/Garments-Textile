import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import useWishlist from '@/hooks/useWishlist';
import ProductGrid from '@/components/product/ProductGrid';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getWishlist } from '@/services/api/customerApi';

export default function CustomerWishlist() {
  usePageTitle('Wishlist');
  const { ids } = useWishlist();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const load = () => { setError(''); getWishlist().then((r) => setProducts(r.data.products)).catch((e) => setError(e.message)); };
  useEffect(load, []);

  // Hearts toggle through WishlistContext, so hide a card as soon as it is un-saved.
  const visible = products?.filter((p) => ids.includes(p._id));

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Wishlist</h1>
      {error ? <ErrorMessage title="Could not load your wishlist" message={error} onRetry={load} /> : (
        <ProductGrid
          products={visible}
          loading={products === null}
          skeletonCount={4}
          columns="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
          emptyMessage={<>Nothing saved yet. Tap the heart on any fabric to keep it here. <Link to="/products">Browse fabrics</Link></>}
        />
      )}
    </div>
  );
}
