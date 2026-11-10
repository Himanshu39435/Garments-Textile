import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { createAddress, listAddresses } from '@/services/api/customerApi';

/**
 * Delivery address, billing address, payment method and notes for any checkout (cart or quotation).
 * Pairs with <CheckoutDetails details={...} />.
 */
export default function useCheckoutDetails() {
  const [addresses, setAddresses] = useState(null);
  const [shippingId, setShippingId] = useState();
  const [billingSame, setBillingSame] = useState(true);
  const [billingId, setBillingId] = useState();
  const [method, setMethod] = useState('razorpay');
  const [notes, setNotes] = useState('');
  const [modalFor, setModalFor] = useState(null); // 'shipping' | 'billing' | null
  const [savingAddress, setSavingAddress] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    listAddresses().then((r) => {
      setAddresses(r.data);
      const initial = r.data.find((a) => a.isDefault) ?? r.data[0];
      if (initial) { setShippingId(initial._id); setBillingId(initial._id); }
    }).catch((e) => { setAddresses([]); setLoadError(e.message); });
  }, []);

  const saveAddress = useCallback(async (values) => {
    setSavingAddress(true);
    try {
      const response = await createAddress({ ...values, isDefault: Boolean(values.isDefault) });
      setAddresses((list) => [response.data, ...(list ?? [])]);
      if (modalFor === 'shipping' || !shippingId) setShippingId(response.data._id);
      if (modalFor === 'billing') setBillingId(response.data._id);
      setModalFor(null);
      message.success('Address saved');
    } catch (e) {
      message.error(e.message);
    } finally {
      setSavingAddress(false);
    }
  }, [modalFor, shippingId]);

  /** Body for POST /orders and POST /quotations/:id/convert. */
  const payload = () => ({ shippingAddressId: shippingId, billingAddressId: billingSame ? undefined : billingId, paymentMethod: method, notes: notes.trim() || undefined });

  return { addresses, shippingId, setShippingId, billingSame, setBillingSame, billingId, setBillingId, method, setMethod, notes, setNotes, modalFor, setModalFor, savingAddress, saveAddress, loadError, payload };
}
