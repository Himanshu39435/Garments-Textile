import apiClient from '@/services/api/apiClient';

/** Every call resolves to { data: Cart } where Cart = { items, itemCount, hasIssues, totals }. Prices come from the server. */
export const getCart = (addressId) => apiClient.get('/cart', { params: addressId ? { addressId } : undefined });
export const addCartItem = (productId, quantity) => apiClient.post('/cart/items', { productId, quantity });
export const updateCartItem = (productId, quantity) => apiClient.put(`/cart/items/${productId}`, { quantity });
export const removeCartItem = (productId) => apiClient.delete(`/cart/items/${productId}`);
export const clearCart = () => apiClient.delete('/cart');
