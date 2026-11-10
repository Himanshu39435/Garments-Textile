import { useState } from 'react';
import { Modal, message } from 'antd';
import useAuth from '@/hooks/useAuth';
import { cancelOrder, downloadInvoice } from '@/services/api/orderApi';
import { payWithRazorpay } from '@/utils/razorpayCheckout';
import { downloadBlob } from '@/utils/downloadFile';

/**
 * Pay-now, cancel and invoice-download behaviour shared by the order confirmation page and the account order page.
 * `reload()` refetches the order; `setOrder(order)` replaces it after cancelling.
 */
export default function useOrderActions(order, { reload, setOrder }) {
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const payNow = async () => {
    setPaying(true);
    try {
      await payWithRazorpay(order, { prefill: { name: user.name, email: user.email, contact: user.phone }, onFailure: (m) => message.error(m) });
      await reload();
    } catch (e) {
      message.error(e.message);
    } finally {
      setPaying(false);
    }
  };

  const confirmCancel = () => Modal.confirm({
    title: 'Cancel this order?',
    content: 'The reserved fabric goes back into stock. This cannot be undone.',
    okText: 'Cancel order', okButtonProps: { danger: true }, cancelText: 'Keep order',
    onOk: async () => {
      try { setOrder((await cancelOrder(order._id)).data); message.success('Order cancelled'); } catch (e) { message.error(e.message); }
    },
  });

  const saveInvoice = async () => {
    setDownloading(true);
    try {
      const blob = await downloadInvoice(order._id);
      downloadBlob(blob, `Invoice-${(order.invoiceNumber ?? order.orderNumber).replace(/\//g, '-')}.pdf`);
    } catch (e) {
      message.error(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const canCancel = order.status === 'pending' && order.paymentStatus !== 'paid';
  const needsPayment = order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid' && order.status !== 'cancelled';
  const hasInvoice = order.paymentStatus === 'paid';
  return { paying, downloading, payNow, confirmCancel, saveInvoice, canCancel, needsPayment, hasInvoice };
}
