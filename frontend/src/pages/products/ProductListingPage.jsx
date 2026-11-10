import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Drawer, Select, Tag } from 'antd';
import { SlidersHorizontal } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useCategories, useProductFilterOptions, useProducts } from '@/hooks/useProducts';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import ProductQuickView from '@/components/product/ProductQuickView';
import Pagination from '@/components/common/Pagination';
import ErrorMessage from '@/components/common/ErrorMessage';
import { formatCurrency } from '@/utils/formatCurrency';

const PAGE_SIZE = 12;
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
];

const list = (v) => (v ? v.split(',').filter(Boolean) : []);
const num = (v) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

/**
 * Catalogue with search, filters, sorting and pagination. All state lives in the URL query string,
 * so results can be bookmarked and shared. CategoryPage reuses this with a fixed `categorySlug`.
 */
export default function ProductListingPage({ categorySlug, title = 'Wholesale products', intro = 'Browse PNT, Kurtis and 3-piece Kurti Sets manufactured for wholesale buyers.' }) {
  usePageTitle(title);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);

  const values = useMemo(() => ({
    search: searchParams.get('search') ?? '',
    fabric: list(searchParams.get('fabric')),
    color: list(searchParams.get('color')),
    minPrice: num(searchParams.get('minPrice')),
    maxPrice: num(searchParams.get('maxPrice')),
    sort: searchParams.get('sort') ?? 'newest',
    page: num(searchParams.get('page')) ?? 1,
  }), [searchParams]);

  const { products, meta, loading, error, refetch } = useProducts({
    search: values.search,
    category: categorySlug,
    fabric: values.fabric.join(','),
    color: values.color.join(','),
    minPrice: values.minPrice,
    maxPrice: values.maxPrice,
    sort: values.sort,
    page: values.page,
    limit: PAGE_SIZE,
  });
  const { options } = useProductFilterOptions();
  const { categories } = useCategories();

  /** Merge a patch into the URL. Arrays are stored as comma lists; empty values are removed. */
  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) next.delete(key);
      else next.set(key, Array.isArray(value) ? value.join(',') : String(value));
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  const activeChips = [
    values.search && { key: 'search', label: `Search: ${values.search}`, clear: { search: undefined } },
    ...values.fabric.map((f) => ({ key: `f-${f}`, label: f, clear: { fabric: values.fabric.filter((x) => x !== f) } })),
    ...values.color.map((c) => ({ key: `c-${c}`, label: c, clear: { color: values.color.filter((x) => x !== c) } })),
    (values.minPrice !== undefined || values.maxPrice !== undefined) && {
      key: 'price',
      label: `${formatCurrency(values.minPrice ?? options?.price.min ?? 0)} to ${formatCurrency(values.maxPrice ?? options?.price.max ?? 0)}`,
      clear: { minPrice: undefined, maxPrice: undefined },
    },
  ].filter(Boolean);

  const clearAll = () => setSearchParams({});
  const filters = <ProductFilters options={options} values={values} onChange={updateFilters} categories={categories} activeCategory={categorySlug} />;

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {intro && <p className="mt-3 mb-0 text-ink/75 max-w-prose">{intro}</p>}
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-10">
        <aside className="hidden lg:block" aria-label="Filters">{filters}</aside>

        <section aria-label="Results" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="m-0 text-ink/70" role="status">{loading ? 'Loading products' : `${meta?.total ?? 0} ${meta?.total === 1 ? 'product' : 'products'}`}</p>
            <div className="flex items-center gap-3">
              <button type="button" className="lg:hidden btn-outline !py-2" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filters</button>
              <Select aria-label="Sort by" value={values.sort} onChange={(sort) => updateFilters({ sort })} options={SORTS} className="w-48" />
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeChips.map((c) => <Tag key={c.key} closable onClose={() => updateFilters(c.clear)} className="!m-0 capitalize">{c.label}</Tag>)}
              <button type="button" onClick={clearAll} className="bg-transparent border-0 text-primary underline cursor-pointer">Clear all</button>
            </div>
          )}

          {error ? (
            <ErrorMessage title="Could not load fabrics" message={error} onRetry={refetch} />
          ) : (
            <>
              <ProductGrid
                products={products}
                loading={loading}
                skeletonCount={PAGE_SIZE}
                onQuickView={setQuickView}
                emptyMessage={activeChips.length ? 'No products match these filters. Try removing one.' : 'No wholesale products are listed here yet.'}
                columns="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
              />
              <Pagination page={values.page} pageSize={PAGE_SIZE} total={meta?.total ?? 0} onChange={(page) => updateFilters({ page })} />
            </>
          )}
        </section>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} placement="left" width={320} title="Filters">{filters}</Drawer>
      <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
