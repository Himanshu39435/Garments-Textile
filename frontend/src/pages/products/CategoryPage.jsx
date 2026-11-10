import { useParams } from 'react-router-dom';
import ProductListingPage from '@/pages/products/ProductListingPage';
import NotFoundPage from '@/pages/home/NotFoundPage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useCategory } from '@/hooks/useProducts';

/** /category/:slug. Looks up the category, then renders the shared catalogue limited to it. */
export default function CategoryPage() {
  const { slug } = useParams();
  const { category, loading, error, notFound, refetch } = useCategory(slug);

  if (loading) return <LoadingSpinner fullPage />;
  if (notFound) return <NotFoundPage />;
  if (error) return <div className="container-page py-14"><ErrorMessage message={error} onRetry={refetch} /></div>;
  return <ProductListingPage key={slug} categorySlug={slug} title={category.name} intro={category.description} />;
}
