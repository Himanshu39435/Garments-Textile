import apiClient from '@/services/api/apiClient';

export const register = (payload) => apiClient.post('/auth/register', payload);
export const verifyOtp = (email, otp) => apiClient.post('/auth/verify-otp', { email, otp });
export const resendOtp = (email) => apiClient.post('/auth/resend-otp', { email });
export const login = (email, password) => apiClient.post('/auth/login', { email, password });
export const forgotPassword = (email) => apiClient.post('/auth/forgot-password', { email });
export const resetPassword = (email, otp, newPassword) => apiClient.post('/auth/reset-password', { email, otp, newPassword });
export const getCurrentUser = () => apiClient.get('/auth/me');
export const changePassword = (currentPassword, newPassword) => apiClient.put('/auth/password', { currentPassword, newPassword });
