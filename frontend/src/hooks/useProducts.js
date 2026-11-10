import { useCallback, useEffect, useState } from 'react';
import { getProduct, getProductFilters, listProducts } from '@/services/api/productApi';
import { getCategory, listCategories } from '@/services/api/categoryApi';

/** Small shared fetch hook: runs `fetcher` whenever `key` changes and ignores stale responses. */
function useFetch(fetcher, key, initial) {
  const [state, setState] = useState({ ...initial, loading: true, error: null, status: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null, status: null }));
    fetcher()
      .then((response) => active && setState({ ...initial, ...response, loading: false, error: null, status: null }))
      .catch((error) => active && setState((s) => ({ ...s, loading: false, error: error.message, status: error.status ?? null })));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reloadToken]);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);
  return { ...state, refetch };
}

/** Catalogue list. `params` is the object accepted by GET /api/products. */
export function useProducts(params) {
  const key = JSON.stringify(params);
  const { data, meta, ...rest } = useFetch(() => listProducts(JSON.parse(key)), key, { data: [], meta: null });
  return { products: data, meta, ...rest };
}

/** One product with related items. `notFound` is true for a 404. */
export function useProduct(slug) {
  const { data, status, ...rest } = useFetch(() => getProduct(slug), slug, { data: null });
  return { product: data, notFound: status === 404, ...rest };
}

/** Filter sidebar options (fabric types, colours, price range). */
export function useProductFilterOptions() {
  const { data, ...rest } = useFetch(getProductFilters, 'filters', { data: null });
  return { options: data, ...rest };
}

export function useCategories() {
  const { data, ...rest } = useFetch(listCategories, 'categories', { data: [] });
  return { categories: data, ...rest };
}

export function useCategory(slug) {
  const { data, status, ...rest } = useFetch(() => getCategory(slug), slug, { data: null });
  return { category: data, notFound: status === 404, ...rest };
}
