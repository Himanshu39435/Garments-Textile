import apiClient from '@/services/api/apiClient';

/** PUT /api/customer/profile. Any of: name, phone, companyName, gstin, businessType. */
export const updateProfile = (payload) => apiClient.put('/customer/profile', payload);

/** Address book. An address is { fullName, phone, line1, line2?, city, stateCode, pincode, companyName?, label?, isDefault? } */
export const listAddresses = () => apiClient.get('/customer/addresses');
export const createAddress = (payload) => apiClient.post('/customer/addresses', payload);
export const updateAddress = (id, payload) => apiClient.put(`/customer/addresses/${id}`, payload);
export const deleteAddress = (id) => apiClient.delete(`/customer/addresses/${id}`);

/** Dashboard counts and latest orders. */
export const getDashboard = () => apiClient.get('/customer/dashboard');

/** Wishlist. get -> { ids, products }; add/remove -> { ids } */
export const getWishlist = () => apiClient.get('/customer/wishlist');
export const addToWishlist = (productId) => apiClient.post(`/customer/wishlist/${productId}`);
export const removeFromWishlist = (productId) => apiClient.delete(`/customer/wishlist/${productId}`);
