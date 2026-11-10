import apiClient from '@/services/api/apiClient';

/** payload: { shippingAddressId, billingAddressId?, paymentMethod: 'razorpay' | 'bank_transfer', notes? } */
export const createOrder = (payload) => apiClient.post('/orders', payload);
export const listOrders = (params) => apiClient.get('/orders', { params });
export const getOrder = (id) => apiClient.get(`/orders/${id}`);
export const cancelOrder = (id) => apiClient.post(`/orders/${id}/cancel`);

/** GET /api/orders/:id/invoice resolves to a PDF Blob. Only available for paid orders. */
export const downloadInvoice = (id) => apiClient.get(`/orders/${id}/invoice`, { responseType: 'blob' });
