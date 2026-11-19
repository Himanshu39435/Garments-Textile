import { Link } from 'react-router-dom';
import CategoryVisual from '@/components/common/CategoryVisual';
import useCategoryList from '@/hooks/useCategoryList';
import ProductShowcase from '@/pages/home/sections/ProductShowcase';

export default function FeaturedCategories() {
  const categories = useCategoryList();
  return (
    <section className="container-page pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h2 className="text-3xl md:text-4xl">Explore our collection</h2>
      </div>
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 list-none m-0 p-0">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link to={`/category/${c.slug}`} className="surface group flex flex-col h-full no-underline overflow-hidden">
              <div className="bg-secondary p-4 md:p-6 h-36 md:h-52">
                <CategoryVisual category={c} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" />
              </div>
              <div className="p-4">
                <h3 className="text-lg md:text-xl">{c.name}</h3>
                <p className="mt-1 mb-0 text-sm text-ink/70 hidden md:block">{c.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <ProductShowcase />
    </section>
  );
}
