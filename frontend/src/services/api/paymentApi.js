import apiClient from '@/services/api/apiClient';

/** Returns { keyId, razorpayOrderId, amount (paise), currency, orderNumber } for the Razorpay popup. */
export const createRazorpayOrder = (orderId) => apiClient.post('/payments/razorpay/order', { orderId });

/** Sends Razorpay's callback fields to the server, which checks the signature before marking the order paid. */
export const verifyRazorpayPayment = (payload) => apiClient.post('/payments/razorpay/verify', payload);
