import { createContext, useEffect, useMemo, useState } from 'react';
import { listCategories } from '@/services/api/categoryApi';
import { FABRIC_CATEGORY_DETAILS } from '@/utils/constants';

export const CategoryContext = createContext({ categories: FABRIC_CATEGORY_DETAILS });

/**
 * Categories for menus, footer and the home page, loaded once from the API so renames, new categories and hidden ones
 * made in the admin panel show up everywhere. Falls back to the built-in list while loading or if the API is unreachable.
 */
export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(FABRIC_CATEGORY_DETAILS);
  useEffect(() => {
    listCategories().then((r) => { if (r.data.length) setCategories(r.data); }).catch(() => {});
  }, []);
  const value = useMemo(() => ({ categories }), [categories]);
  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}
