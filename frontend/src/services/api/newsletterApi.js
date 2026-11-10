import apiClient from '@/services/api/apiClient';

/** POST /api/newsletter/subscribe -> { success, message } */
export const subscribeToNewsletter = (email) => apiClient.post('/newsletter/subscribe', { email });
