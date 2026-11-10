import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import * as customerApi from '@/services/api/customerApi';

export const WishlistContext = createContext(null);

/** Saved product ids for the signed-in customer, kept in sync with the server so hearts render correctly everywhere. */
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!user) { setIds([]); return; }
    customerApi.getWishlist().then((r) => setIds(r.data.ids)).catch(() => setIds([]));
  }, [user]);

  /** Adds or removes a product. Updates the heart immediately and rolls back if the server refuses. */
  const toggle = useCallback(async (productId) => {
    const saved = ids.includes(productId);
    setIds((list) => (saved ? list.filter((id) => id !== productId) : [...list, productId]));
    try {
      const response = await (saved ? customerApi.removeFromWishlist(productId) : customerApi.addToWishlist(productId));
      setIds(response.data.ids);
      return !saved;
    } catch (error) {
      setIds((list) => (saved ? [...list, productId] : list.filter((id) => id !== productId)));
      throw error;
    }
  }, [ids]);

  const value = useMemo(() => ({ ids, count: ids.length, has: (id) => ids.includes(id), toggle }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
