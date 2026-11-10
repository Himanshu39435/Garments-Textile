import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import useAuth from '@/hooks/useAuth';
import { payWithRazorpay } from '@/utils/razorpayCheckout';

/**
 * After an order exists: for online payment open Razorpay, then go to the order page.
 * If payment is not completed the order stays payable from that page. Used by cart checkout and quotation checkout.
 */
export default function useCompleteOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return async (order, method) => {
    if (method === 'razorpay') {
      try {
        const result = await payWithRazorpay(order, { prefill: { name: user.name, email: user.email, contact: user.phone }, onFailure: (m) => message.error(m) });
        navigate(`/order-success/${order._id}${result.paid ? '' : '?payment=pending'}`, { replace: true });
      } catch (e) {
        message.error(e.message);
        navigate(`/order-success/${order._id}?payment=pending`, { replace: true });
      }
      return;
    }
    navigate(`/order-success/${order._id}`, { replace: true });
  };
}
