import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Form, Input, Modal, Table, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import usePanelPaths from '@/hooks/usePanelPaths';
import OrderSummaryView from '@/components/order/OrderSummaryView';
import { OrderTags } from '@/components/order/OrderStatusTag';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { downloadAdminInvoice, getAdminOrder, markOrderPaid, markOrderRefunded, updateOrderShipment, updateOrderStatus } from '@/services/api/adminApi';
import { downloadBlob } from '@/utils/downloadFile';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const COURIER = [{ name: 'courier', label: 'Courier or transport', required: true }, { name: 'trackingNumber', label: 'Tracking number' }, { name: 'trackingUrl', label: 'Tracking link (https://…)' }];
const MODALS = {
  ship: { title: 'Mark as shipped', ok: 'Mark shipped', fields: COURIER, run: (id, v) => updateOrderStatus(id, { status: 'shipped', ...v }), done: 'Marked as shipped. The customer was emailed.' },
  shipment: { title: 'Edit shipping details', ok: 'Save details', fields: COURIER, run: updateOrderShipment, done: 'Shipping details updated' },
  cancel: { title: 'Cancel this order', ok: 'Cancel order', danger: true, fields: [{ name: 'note', label: 'Reason (shown in the history and emailed to the customer)', area: true }], run: (id, v) => updateOrderStatus(id, { status: 'cancelled', ...v }), done: 'Order cancelled and stock returned' },
  paid: { title: 'Confirm bank transfer received', ok: 'Confirm payment', fields: [{ name: 'reference', label: 'Bank reference / UTR (optional)' }], run: (id, v) => markOrderPaid(id, v.reference), done: 'Payment recorded and order confirmed' },
  refund: { title: 'Record refund', ok: 'Record refund', fields: [{ name: 'reference', label: 'Refund reference (optional)' }], run: (id, v) => markOrderRefunded(id, v.reference), done: 'Refund recorded' },
};

export default function AdminOrderDetails() {
  const { id } = useParams();
  const { base, isAdmin } = usePanelPaths();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [form] = Form.useForm();
  usePageTitle(order ? `Order ${order.orderNumber}` : 'Order');

  const load = useCallback(() => getAdminOrder(id).then((r) => setOrder(r.data)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorMessage title="Could not load this order" message={error} onRetry={() => { setError(''); load(); }} />;
  if (!order) return <LoadingSpinner />;

  const can = (s) => order.allowedStatuses.includes(s);
  const cfg = modal ? MODALS[modal] : null;
  const openModal = (key) => { setFormError(''); form.resetFields(); if (key === 'shipment') form.setFieldsValue(order.shipment ?? {}); setModal(key); };
  const submit = async (values) => {
    setBusy(true); setFormError('');
    try { const r = await cfg.run(order._id, values); setOrder((o) => ({ ...r.data, payments: o.payments })); message.success(cfg.done); setModal(null); load(); } catch (e) { setFormError(e.message); } finally { setBusy(false); }
  };
  const quick = async (status, text) => { try { const r = await updateOrderStatus(order._id, { status }); setOrder((o) => ({ ...r.data, payments: o.payments })); message.success(text); load(); } catch (e) { message.error(e.message); } };
  const invoice = async () => { try { downloadBlob(await downloadAdminInvoice(order._id), `Invoice-${order.invoiceNumber.replace(/\//g, '-')}.pdf`); } catch (e) { message.error(e.message); } };

  const awaitingTransfer = order.paymentMethod === 'bank_transfer' && order.status === 'pending' && order.paymentStatus !== 'paid';
  const refundDue = order.status === 'cancelled' && order.paymentStatus === 'paid';
  const c = order.customer;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to={`${base}/orders`} className="inline-flex items-center gap-1"><ArrowLeft size={16} /> All orders</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl md:text-4xl">{order.orderNumber}</h1><p className="mt-1 mb-0 text-ink/70">Placed {when(order.createdAt)}{order.invoiceNumber ? ` · Invoice ${order.invoiceNumber}` : ''}{order.quotation ? <> · From quotation <Link to={`${base}/quotations/${order.quotation}`}>{order.quoteNumber}</Link></> : null}</p></div>
        <div className="flex flex-wrap gap-2"><OrderTags order={order} /></div>
      </div>

      {refundDue && <Alert type="warning" showIcon message="Refund due" description={`${formatCurrency(order.pricing.total)} was paid for this cancelled order. ${isAdmin ? 'Refund the customer (in Razorpay or by bank), then record it here.' : 'Tell your admin: only an admin can refund and record it.'}`} action={isAdmin ? <Button type="primary" onClick={() => openModal('refund')}>Record refund</Button> : undefined} />}
      {awaitingTransfer && <Alert type="info" showIcon message="Waiting for a bank transfer" description={`Expecting ${formatCurrency(order.pricing.total)} with reference ${order.orderNumber}.${isAdmin ? '' : ' An admin confirms bank transfers.'}`} action={isAdmin ? <Button type="primary" onClick={() => openModal('paid')}>Mark as received</Button> : undefined} />}

      <section className="surface p-5" aria-label="Actions">
        <h2 className="text-xl mb-3">Actions</h2>
        <div className="flex flex-wrap gap-2">
          {can('processing') && <Button type="primary" onClick={() => quick('processing', 'Order is now processing')}>Start processing</Button>}
          {can('shipped') && <Button type="primary" onClick={() => openModal('ship')}>Mark shipped…</Button>}
          {can('delivered') && <Button type="primary" onClick={() => quick('delivered', 'Marked as delivered')}>Mark delivered</Button>}
          {['shipped', 'delivered'].includes(order.status) && <Button onClick={() => openModal('shipment')}>Edit shipping details</Button>}
          {order.paymentStatus === 'paid' && <Button onClick={invoice}>Download invoice</Button>}
          {isAdmin && can('cancelled') && <Button danger onClick={() => openModal('cancel')}>Cancel order…</Button>}
          {order.allowedStatuses.length === 0 && order.paymentStatus !== 'paid' && <span className="text-ink/60 self-center">No further actions.</span>}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="surface p-5 min-w-0 break-words" aria-labelledby="cust">
          <h2 id="cust" className="text-lg mb-2">Customer</h2>
          <p className="m-0"><Link to={`${base}/customers/${order.user}`} className="font-semibold">{c.name}</Link>{c.companyName ? <><br />{c.companyName}</> : null}</p>
          <p className="my-1 text-ink/80"><a href={`mailto:${c.email}`}>{c.email}</a><br />{c.phone}</p>
          <p className="m-0 text-sm">GSTIN: {c.gstin ? <strong>{c.gstin}</strong> : <span className="text-ink/60">not provided</span>}</p>
        </section>
        <section className="surface p-5 min-w-0 break-words" aria-labelledby="ship-h">
          <h2 id="ship-h" className="text-lg mb-2">Shipping</h2>
          {order.shipment?.courier ? (
            <p className="m-0">{order.shipment.courier}{order.shipment.trackingNumber ? ` · ${order.shipment.trackingNumber}` : ''}<br />
              {order.shipment.shippedAt && <span className="text-sm text-ink/70">Shipped {formatDate(order.shipment.shippedAt)}</span>}
              {order.shipment.deliveredAt && <span className="text-sm text-ink/70"> · Delivered {formatDate(order.shipment.deliveredAt)}</span>}
              {order.shipment.trackingUrl && <><br /><a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer">Tracking link</a></>}</p>
          ) : <p className="m-0 text-ink/60">Not shipped yet.</p>}
          {order.notes && <p className="mt-3 mb-0 text-sm"><strong>Customer notes:</strong> {order.notes}</p>}
        </section>
      </div>

      <OrderSummaryView order={order} />

      <section className="surface p-5" aria-labelledby="pay-h">
        <h2 id="pay-h" className="text-xl mb-3">Payments</h2>
        <Table size="small" rowKey="_id" pagination={false} dataSource={order.payments} scroll={{ x: 'max-content' }} locale={{ emptyText: 'No payment attempts yet.' }}
          columns={[
            { title: 'Method', dataIndex: 'method', render: (m) => (m === 'razorpay' ? 'Razorpay' : 'Bank transfer') },
            { title: 'Amount', dataIndex: 'amount', align: 'right', render: formatCurrency },
            { title: 'Status', dataIndex: 'status', render: (s) => <span className="capitalize">{s}</span> },
            { title: 'Reference', key: 'ref', render: (_, p) => p.razorpayPaymentId ?? p.reference ?? p.razorpayOrderId ?? '—' },
            { title: 'Date', dataIndex: 'createdAt', render: (d) => formatDate(d) },
          ]} />
      </section>

      <section className="surface p-5" aria-labelledby="hist">
        <h2 id="hist" className="text-xl mb-3">History</h2>
        <ol className="list-none m-0 p-0 divide-y divide-line">
          {[...order.statusHistory].reverse().map((h, i) => (
            <li key={i} className="py-2 flex flex-wrap justify-between gap-2"><span><strong className="capitalize text-primary">{h.status}</strong><span className="text-ink/75"> · {h.note}</span></span><span className="text-sm text-ink/60">{when(h.at)}</span></li>
          ))}
        </ol>
      </section>

      <Modal open={Boolean(modal)} title={cfg?.title} onCancel={() => setModal(null)} footer={null} destroyOnHidden forceRender>
        {formError && <Alert type="error" showIcon message={formError} className="!mb-4" />}
        <Form form={form} layout="vertical" requiredMark={false} onFinish={submit}>
          {cfg?.fields.map((fd) => (
            <Form.Item key={fd.name} name={fd.name} label={fd.label} rules={fd.required ? [{ required: true, whitespace: true, message: `Enter ${fd.label.toLowerCase()}` }] : []}>
              {fd.area ? <Input.TextArea rows={3} maxLength={300} showCount /> : <Input maxLength={fd.name === 'trackingUrl' ? 300 : 80} />}
            </Form.Item>
          ))}
          <div className="flex gap-3"><Button type="primary" danger={cfg?.danger} htmlType="submit" loading={busy}>{cfg?.ok}</Button><Button onClick={() => setModal(null)}>Back</Button></div>
        </Form>
      </Modal>
    </div>
  );
}
