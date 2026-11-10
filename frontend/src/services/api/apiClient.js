import axios from 'axios';
import { API_BASE_URL, TOKEN_STORAGE_KEY } from '@/utils/constants';

/** Shared Axios instance. Feature API files (authApi.js, productApi.js, ...) import this. */
const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data, // unwrap to { success, message, data, meta }
  async (error) => {
    const status = error.response?.status;
    let payload = error.response?.data;
    if (payload instanceof Blob) { // file downloads: the error body arrives as a Blob, so read the message out of it
      try { payload = JSON.parse(await payload.text()); } catch { payload = undefined; }
    }
    if (status === 401 && localStorage.getItem(TOKEN_STORAGE_KEY)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event('auth:expired')); // AuthContext listens and signs the user out
    }
    const detailMessage = Array.isArray(payload?.details)
      ? payload.details.map((detail) => `${detail.field}: ${detail.message}`).join('; ')
      : '';
    const message = detailMessage || payload?.message || error.message || 'Network error';
    return Promise.reject(Object.assign(new Error(message), { status, details: payload?.details, code: payload?.code }));
  },
);

export default apiClient;
