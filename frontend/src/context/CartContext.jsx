import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import * as cartApi from '@/services/api/cartApi';

export const CartContext = createContext(null);
const EMPTY = { items: [], itemCount: 0, hasIssues: false, totals: { subtotal: 0, shipping: 0, gst: 0, total: 0, taxType: null, freeShippingThreshold: 0 } };

/**
 * Mirrors the server cart for the signed-in user. The server prices everything, so this holds no price logic.
 * Every action resolves with the fresh cart or throws an Error whose message is safe to show.
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const response = await cartApi.getCart();
    setCart(response.data);
    return response.data;
  }, []);

  useEffect(() => {
    if (!user) { setCart(EMPTY); return; }
    setLoading(true);
    refresh().catch(() => setCart(EMPTY)).finally(() => setLoading(false));
  }, [user, refresh]);

  const run = useCallback(async (request) => {
    const response = await request();
    setCart(response.data);
    return response.data;
  }, []);

  const value = useMemo(() => ({
    cart, loading, itemCount: cart.itemCount, refresh,
    addItem: (productId, quantity) => run(() => cartApi.addCartItem(productId, quantity)),
    updateItem: (productId, quantity) => run(() => cartApi.updateCartItem(productId, quantity)),
    removeItem: (productId) => run(() => cartApi.removeCartItem(productId)),
    clear: () => run(cartApi.clearCart),
  }), [cart, loading, refresh, run]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
