import apiClient from '@/services/api/apiClient';

/** payload: { items: [{ productId, quantity, requestedPrice? }], notes?, requiredBy? (YYYY-MM-DD) } */
export const requestQuotation = (payload) => apiClient.post('/quotations', payload);
export const listQuotations = (params) => apiClient.get('/quotations', { params });
/** With addressId the totals include the CGST/SGST vs IGST split for that delivery state. */
export const getQuotation = (id, addressId) => apiClient.get(`/quotations/${id}`, { params: addressId ? { addressId } : undefined });
export const cancelQuotation = (id) => apiClient.post(`/quotations/${id}/cancel`);
/** Same body as checkout: { shippingAddressId, billingAddressId?, paymentMethod, notes? } */
export const convertQuotation = (id, payload) => apiClient.post(`/quotations/${id}/convert`, payload);
