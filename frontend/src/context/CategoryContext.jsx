import { createContext, useEffect, useMemo, useState } from 'react';
import { listCategories } from '@/services/api/categoryApi';

export const CategoryContext = createContext({ categories: [] });

/**
 * Categories for menus, footer and the home page, loaded once from the API so renames, new categories and hidden ones
 * made in the admin panel show up everywhere. The Explore section waits for live categories instead of showing stale fallbacks.
 */
export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let active = true;
    listCategories()
      .then((response) => {
        if (active && Array.isArray(response.data) && response.data.length) setCategories(response.data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const value = useMemo(() => ({ categories }), [categories]);
  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}
