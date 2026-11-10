import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import dayjs from 'dayjs';
import usePageTitle from '@/hooks/usePageTitle';
import usePanelPaths from '@/hooks/usePanelPaths';
import QuotationStatusTag from '@/components/quotation/QuotationStatusTag';
import QuotationSummaryView from '@/components/quotation/QuotationSummaryView';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { approveQuotation, convertQuotationForCustomer, getAdminQuotation, rejectQuotation } from '@/services/api/adminApi';
import { previewQuote } from '@/utils/quotePricing';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const EDITABLE = ['requested', 'approved', 'expired'];

export default function AdminQuotationDetails() {
  const { id } = useParams();
  const { base } = usePanelPaths();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(quote ? `Quotation ${quote.quoteNumber}` : 'Quotation');
  const load = useCallback(() => getAdminQuotation(id).then((r) => setQuote(r.data)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorMessage title="Could not load this quotation" message={error} onRetry={() => { setError(''); load(); }} />;
  if (!quote) return <LoadingSpinner />;
  return <Details key={`${quote.status}-${quote.updatedAt}`} quote={quote} reload={load} navigate={navigate} />;
}

function Details({ quote, reload, navigate }) {
  const editable = EDITABLE.includes(quote.status);
  const [prices, setPrices] = useState(() => Object.fromEntries(quote.items.map((i) => [String(i.product), { quantity: i.quantity, quotedPrice: i.quotedPrice ?? i.listPrice }])));
  const [discount, setDiscount] = useState(quote.discountPercent ?? 0);
  const [shipping, setShipping] = useState(quote.priced ? quote.shippingCharge : undefined);
  const [validUntil, setValidUntil] = useState(quote.validUntil && quote.status === 'approved' ? dayjs(quote.validUntil) : dayjs().add(14, 'day'));
  const [note, setNote] = useState(quote.adminNote ?? '');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const preview = useMemo(() => previewQuote(quote.items.map((i) => ({ ...i, ...prices[String(i.product)] })), discount, shipping), [quote.items, prices, discount, shipping]);
  const setLine = (pid, patch) => setPrices((p) => ({ ...p, [pid]: { ...p[pid], ...patch } }));

  const approve = async () => {
    setFormError(''); setBusy(true);
    try {
      await approveQuotation(quote._id, {
        items: quote.items.map((i) => ({ productId: String(i.product), quantity: prices[String(i.product)].quantity, quotedPrice: prices[String(i.product)].quotedPrice })),
        discountPercent: discount || 0, shippingCharge: shipping ?? undefined, validUntil: validUntil.format('YYYY-MM-DD'), adminNote: note.trim() || undefined,
      });
      message.success('Quotation approved and emailed to the customer');
      reload();
    } catch (e) { setFormError(e.message); } finally { setBusy(false); }
  };
  const reject = async () => {
    setBusy(true);
    try { await rejectQuotation(quote._id, reason.trim()); message.success('Quotation rejected'); setRejecting(false); reload(); } catch (e) { setFormError(e.message); setRejecting(false); } finally { setBusy(false); }
  };
  const convert = () => Modal.confirm({
    title: 'Create the order for this customer?',
    content: 'Use this when they agreed by phone. The order uses their default saved address and bank transfer, and waits for payment like any bank-transfer order. They are emailed.',
    okText: 'Create order', cancelText: 'Not now',
    onOk: async () => { try { const r = await convertQuotationForCustomer(quote._id); message.success('Order created'); navigate(`${base}/orders/${r.data.order._id}`); } catch (e) { message.error(e.message); } },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to={`${base}/quotations`} className="inline-flex items-center gap-1"><ArrowLeft size={16} /> All quotations</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl md:text-4xl">{quote.quoteNumber}</h1><p className="mt-1 mb-0 text-ink/70">Requested {when(quote.createdAt)}{quote.requiredBy ? ` · needed by ${formatDate(quote.requiredBy)}` : ''}</p></div>
        <QuotationStatusTag status={quote.status} />
      </div>

      {quote.status === 'converted' && quote.orderSummary && <Alert type="success" showIcon message={`Ordered as ${quote.orderSummary.orderNumber}`} action={<Link to={`${base}/orders/${quote.order}`} className="btn-primary !py-2 no-underline">View order</Link>} />}
      {quote.status === 'rejected' && <Alert type="error" showIcon message="Rejected" description={quote.rejectionReason} />}
      {quote.status === 'cancelled' && <Alert type="info" showIcon message="Withdrawn by the customer" />}
      {quote.status === 'expired' && <Alert type="warning" showIcon message={`Expired on ${formatDate(quote.validUntil)}`} description="You can re-price and send it again below." />}

      <div className="grid md:grid-cols-2 gap-4">
        <section className="surface p-5 min-w-0 break-words" aria-labelledby="cu">
          <h2 id="cu" className="text-lg mb-2">Customer</h2>
          <p className="m-0"><Link to={`${base}/customers/${quote.user}`} className="font-semibold">{quote.customer.name}</Link>{quote.customer.companyName ? <><br />{quote.customer.companyName}</> : null}</p>
          <p className="my-1 text-ink/80"><a href={`mailto:${quote.customer.email}`}>{quote.customer.email}</a><br />{quote.customer.phone}</p>
          <p className="m-0 text-sm">GSTIN: {quote.customer.gstin ? <strong>{quote.customer.gstin}</strong> : <span className="text-ink/60">not provided</span>}</p>
        </section>
        <section className="surface p-5 min-w-0 break-words" aria-labelledby="nt">
          <h2 id="nt" className="text-lg mb-2">Customer notes</h2>
          <p className="m-0 text-ink/80 whitespace-pre-line">{quote.notes || <span className="text-ink/60">None.</span>}</p>
        </section>
      </div>

      {editable ? (
        <section className="surface p-5 md:p-6" aria-labelledby="pricing">
          <h2 id="pricing" className="text-xl mb-1">Pricing</h2>
          <p className="mt-0 mb-4 text-sm text-ink/60">Prices are per metre before discount and GST. The discount is applied to every rate.</p>
          {formError && <Alert type="error" showIcon message={formError} closable onClose={() => setFormError('')} className="!mb-4" />}
          <ul className="list-none m-0 p-0 divide-y divide-line">
            {quote.items.map((i) => {
              const pid = String(i.product); const line = prices[pid];
              return (
                <li key={pid} className="py-4 flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1 basis-48"><strong className="text-primary">{i.name}</strong><span className="block text-sm text-ink/60">{i.sku}</span>
                    <span className="block text-sm text-ink/70">List {formatCurrency(i.listPrice)}/m{i.requestedPrice ? <> · customer target <strong>{formatCurrency(i.requestedPrice)}</strong>/m</> : null}</span></div>
                  <label className="text-sm">Quantity (m)<br /><InputNumber aria-label={`Quantity of ${i.name}`} min={1} precision={0} value={line.quantity} onChange={(v) => setLine(pid, { quantity: v })} style={{ width: 120 }} /></label>
                  <label className="text-sm">Your price per m<br /><InputNumber aria-label={`Price for ${i.name}`} min={0.01} precision={2} value={line.quotedPrice} onChange={(v) => setLine(pid, { quotedPrice: v })} addonBefore="₹" style={{ width: 160 }} /></label>
                </li>
              );
            })}
          </ul>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <label className="text-sm">Discount on all items (%)<br /><InputNumber aria-label="Discount percent" min={0} max={50} step={0.5} precision={1} value={discount} onChange={(v) => setDiscount(v ?? 0)} style={{ width: '100%' }} /></label>
            <label className="text-sm">Shipping charge (₹)<br /><InputNumber aria-label="Shipping charge" min={0} precision={2} value={shipping} onChange={(v) => setShipping(v ?? undefined)} placeholder="Standard rule" style={{ width: '100%' }} /></label>
            <label className="text-sm" htmlFor="valid-until">Valid until<br /><DatePicker id="valid-until" value={validUntil} onChange={(d) => d && setValidUntil(d)} allowClear={false} disabledDate={(d) => d.isBefore(dayjs(), 'day') || d.isAfter(dayjs().add(90, 'day'))} style={{ width: '100%' }} /></label>
          </div>
          <label htmlFor="admin-note" className="block mt-4 mb-1 text-sm">Message to the customer (optional)</label>
          <Input.TextArea id="admin-note" rows={3} maxLength={500} showCount value={note} onChange={(e) => setNote(e.target.value)} placeholder="Payment terms, delivery timeline, packing" />

          <dl className="m-0 mt-5 pt-4 border-t border-line max-w-sm ml-auto" aria-label="Preview">
            <div className="flex justify-between py-0.5"><dt className="text-ink/70">Subtotal</dt><dd className="m-0">{formatCurrency(preview.subtotal)}</dd></div>
            <div className="flex justify-between py-0.5"><dt className="text-ink/70">GST</dt><dd className="m-0">{formatCurrency(preview.gst)}</dd></div>
            <div className="flex justify-between py-0.5"><dt className="text-ink/70">Shipping</dt><dd className="m-0">{preview.shipping === null ? 'Standard rule' : formatCurrency(preview.shipping)}</dd></div>
            {preview.savings > 0 && <div className="flex justify-between py-0.5 text-emerald-800"><dt>Customer saves vs list</dt><dd className="m-0">{formatCurrency(preview.savings)}</dd></div>}
            <div className="flex justify-between pt-2 mt-1 border-t border-line font-semibold text-primary text-lg"><dt>{preview.shipping === null ? 'Total before shipping' : 'Total'}</dt><dd className="m-0">{formatCurrency(preview.total)}</dd></div>
          </dl>
          <p className="mt-2 mb-0 text-xs text-ink/60 text-right">Preview only. The exact figures, with the standard shipping rule applied, are fixed when you send the quote.</p>

          <div className="flex flex-wrap gap-3 mt-5">
            <Button type="primary" size="large" loading={busy} onClick={approve}>{quote.status === 'requested' ? 'Approve and send to customer' : 'Update and re-send'}</Button>
            <Button size="large" danger onClick={() => { setReason(''); setRejecting(true); }}>Reject request…</Button>
          </div>
        </section>
      ) : <QuotationSummaryView quote={quote} />}

      {quote.status === 'approved' && (
        <section className="surface p-5" aria-labelledby="conv">
          <h2 id="conv" className="text-lg mb-1">Place the order for the customer</h2>
          <p className="mt-0 text-sm text-ink/70">If they agreed by phone you can create the order now. Customers can also order themselves from their account.</p>
          <Button onClick={convert} disabled={!quote.customerHasAddress}>Create order for customer</Button>
          {!quote.customerHasAddress && <p className="mt-2 mb-0 text-sm text-ink/60">This customer has no saved address yet.</p>}
        </section>
      )}

      <section className="surface p-5" aria-labelledby="qh">
        <h2 id="qh" className="text-xl mb-3">History</h2>
        <ol className="list-none m-0 p-0 divide-y divide-line">
          {[...quote.statusHistory].reverse().map((h, n) => <li key={n} className="py-2 flex flex-wrap justify-between gap-2"><span><strong className="capitalize text-primary">{h.status}</strong><span className="text-ink/75"> · {h.note}</span></span><span className="text-sm text-ink/60">{when(h.at)}</span></li>)}
        </ol>
      </section>

      <Modal open={rejecting} title="Reject this request" onCancel={() => setRejecting(false)} footer={null} destroyOnHidden>
        <Form layout="vertical" onFinish={reject}>
          <label htmlFor="reason" className="block mb-1 text-sm">Reason (emailed to the customer, optional)</label>
          <Input.TextArea id="reason" rows={3} maxLength={300} showCount value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-3 mt-4"><Button type="primary" danger htmlType="submit" loading={busy}>Reject request</Button><Button onClick={() => setRejecting(false)}>Back</Button></div>
        </Form>
      </Modal>
    </div>
  );
}
