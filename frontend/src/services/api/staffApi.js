import apiClient from '@/services/api/apiClient';

/** Staff dashboard: the work queue, low-stock list and this month's activity. Staff accounts only. */
export const getStaffDashboard = () => apiClient.get('/staff/dashboard');
