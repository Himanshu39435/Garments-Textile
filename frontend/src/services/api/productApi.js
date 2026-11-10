import apiClient from '@/services/api/apiClient';

const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

/** GET /api/products -> { data: Product[], meta: { page, limit, total, totalPages } } */
export const listProducts = (params) => apiClient.get('/products', { params: clean(params) });

/** GET /api/products/filters -> { data: { fabricTypes, colors, price: { min, max } } } */
export const getProductFilters = () => apiClient.get('/products/filters');

/** GET /api/products/:slug -> { data: Product & { related: Product[] } } */
export const getProduct = (slug) => apiClient.get(`/products/${encodeURIComponent(slug)}`);
