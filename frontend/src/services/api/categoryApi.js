import apiClient from '@/services/api/apiClient';

/** GET /api/categories -> { data: Category[] } (each with productCount) */
export const listCategories = () => apiClient.get('/categories');

/** GET /api/categories/:slug */
export const getCategory = (slug) => apiClient.get(`/categories/${encodeURIComponent(slug)}`);
