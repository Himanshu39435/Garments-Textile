import apiClient from '@/services/api/apiClient';

const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const getAdminSession = () => apiClient.get('/admin/session');
export const getAdminDashboard = () => apiClient.get('/admin/dashboard');
export const listAdminPayments = (params) => apiClient.get('/admin/payments', { params: clean(params) });
export const getAdminSalesReport = (params) => apiClient.get('/admin/reports', { params: clean(params) });
export const getWebsiteSettings = () => apiClient.get('/admin/settings');
export const saveWebsiteSettings = (payload) => apiClient.put('/admin/settings', payload);

// Coupons
export const listAdminCoupons = () => apiClient.get('/admin/coupons');
export const createAdminCoupon = (payload) => apiClient.post('/admin/coupons', payload);
export const updateAdminCoupon = (id, payload) => apiClient.put(`/admin/coupons/${id}`, payload);
export const deleteAdminCoupon = (id) => apiClient.delete(`/admin/coupons/${id}`);

/** Uploads one image file. Resolves { data: { url, publicId } }. */
export const uploadImage = (file) => {
  const form = new FormData();
  form.append('image', file);
  return apiClient.post('/admin/uploads/image', form);
};

// Products
export const listAdminProducts = (params) => apiClient.get('/admin/products', { params: clean(params) });
export const getAdminProduct = (id) => apiClient.get(`/admin/products/${id}`);
export const createProduct = (payload) => apiClient.post('/admin/products', payload);
export const updateProduct = (id, payload) => apiClient.put(`/admin/products/${id}`, payload);
export const deleteProduct = (id) => apiClient.delete(`/admin/products/${id}`);

// Categories
export const listAdminCategories = () => apiClient.get('/admin/categories');
export const createCategory = (payload) => apiClient.post('/admin/categories', payload);
export const updateCategory = (id, payload) => apiClient.put(`/admin/categories/${id}`, payload);
export const deleteCategory = (id) => apiClient.delete(`/admin/categories/${id}`);

// Orders
export const listAdminOrders = (params) => apiClient.get('/admin/orders', { params: clean(params) });
export const getAdminOrder = (id) => apiClient.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id, payload) => apiClient.put(`/admin/orders/${id}/status`, payload);
export const updateOrderShipment = (id, payload) => apiClient.put(`/admin/orders/${id}/shipment`, payload);
export const markOrderPaid = (id, reference) => apiClient.post(`/admin/orders/${id}/mark-paid`, { reference: reference || undefined });
export const markOrderRefunded = (id, reference) => apiClient.post(`/admin/orders/${id}/mark-refunded`, { reference: reference || undefined });
export const downloadAdminInvoice = (id) => apiClient.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' });

// Customers
export const listAdminCustomers = (params) => apiClient.get('/admin/customers', { params: clean(params) });
export const getAdminCustomer = (id) => apiClient.get(`/admin/customers/${id}`);
export const setCustomerActive = (id, isActive) => apiClient.put(`/admin/customers/${id}/status`, { isActive });

// Quotations
export const listAdminQuotations = (params) => apiClient.get('/admin/quotations', { params: clean(params) });
export const getAdminQuotation = (id) => apiClient.get(`/admin/quotations/${id}`);
/** payload: { items: [{ productId, quantity, quotedPrice }], discountPercent?, shippingCharge?, validUntil (YYYY-MM-DD), adminNote? } */
export const approveQuotation = (id, payload) => apiClient.put(`/admin/quotations/${id}/approve`, payload);
export const rejectQuotation = (id, reason) => apiClient.put(`/admin/quotations/${id}/reject`, { reason: reason || undefined });
export const convertQuotationForCustomer = (id) => apiClient.post(`/admin/quotations/${id}/convert`);

// Staff accounts (admin only)
export const listStaff = (params) => apiClient.get('/admin/staff', { params: clean(params) });
export const createStaff = (payload) => apiClient.post('/admin/staff', payload);
export const updateStaff = (id, payload) => apiClient.put(`/admin/staff/${id}`, payload);
export const setStaffActive = (id, isActive) => apiClient.put(`/admin/staff/${id}/status`, { isActive });
export const resetStaffPassword = (id, newPassword) => apiClient.put(`/admin/staff/${id}/password`, { newPassword });
