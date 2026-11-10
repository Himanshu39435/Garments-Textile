import { createRazorpayOrder, verifyRazorpayPayment } from '@/services/api/paymentApi';
import { BRAND } from '@/utils/constants';

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let scriptPromise;

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.onload = resolve;
    script.onerror = () => { scriptPromise = undefined; reject(new Error('Could not load the payment window. Check your connection and try again.')); };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Opens Razorpay for an order and verifies the result on the server.
 * Resolves { paid: true } after the server confirmed the signature, or { paid: false } if the buyer closed the window.
 * `onFailure(message)` is called for declined attempts; the buyer can retry inside the same window.
 */
export async function payWithRazorpay(order, { prefill, onFailure } = {}) {
  const { data: rzp } = await createRazorpayOrder(order._id);
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: rzp.keyId,
      amount: rzp.amount,
      currency: rzp.currency,
      name: BRAND.name,
      description: `Order ${rzp.orderNumber}`,
      order_id: rzp.razorpayOrderId,
      prefill,
      theme: { color: '#142B3B' },
      handler: async (response) => {
        try {
          await verifyRazorpayPayment({ orderId: order._id, ...response });
          resolve({ paid: true });
        } catch (error) {
          reject(error);
        }
      },
      modal: { ondismiss: () => resolve({ paid: false }) },
    });
    checkout.on('payment.failed', (event) => onFailure?.(event.error?.description || 'Payment failed. Please try again.'));
    checkout.open();
  });
}
