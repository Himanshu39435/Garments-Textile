import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Modal, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import QuotationStatusTag from '@/components/quotation/QuotationStatusTag';
import QuotationSummaryView from '@/components/quotation/QuotationSummaryView';
import ErrorMessage from '@/components/common/ErrorMessage';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { cancelQuotation, getQuotation } from '@/services/api/quotationApi';
import { formatDate } from '@/utils/formatDate';

const daysLeft = (date) => Math.max(0, Math.ceil((new Date(date) - new Date()) / 86400000));

export default function CustomerQuotationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  usePageTitle(quote ? `Quotation ${quote.quoteNumber}` : 'Quotation');
  const load = useCallback(() => getQuotation(id).then((r) => setQuote(r.data)).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorMessage title="Could not load this quotation" message={error} onRetry={() => { setError(''); load(); }} />;
  if (!quote) return <LoadingSpinner />;

  const cancellable = ['requested', 'approved'].includes(quote.status);
  const confirmCancel = () => Modal.confirm({
    title: quote.status === 'requested' ? 'Withdraw this request?' : 'Decline this quotation?',
    content: 'You can always send a new quote request later.', okText: quote.status === 'requested' ? 'Withdraw' : 'Decline', okButtonProps: { danger: true }, cancelText: 'Keep it',
    onOk: async () => { try { setQuote((await cancelQuotation(quote._id)).data); message.success('Quotation cancelled'); } catch (e) { message.error(e.message); } },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/account/quotations" className="inline-flex items-center gap-1"><ArrowLeft size={16} /> All quotations</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl md:text-4xl">{quote.quoteNumber}</h1><p className="mt-1 mb-0 text-ink/70">Requested {formatDate(quote.createdAt)}{quote.requiredBy ? ` · needed by ${formatDate(quote.requiredBy)}` : ''}</p></div>
        <QuotationStatusTag status={quote.status} />
      </div>

      {quote.status === 'requested' && <Alert type="info" showIcon message="We are preparing your quotation" description="You will get an email as soon as it is ready. It also appears here." />}
      {quote.status === 'approved' && (
        <Alert type={daysLeft(quote.validUntil) <= 3 ? 'warning' : 'success'} showIcon message="Your quotation is ready"
          description={`Prices are fixed until ${formatDate(quote.validUntil)} (${daysLeft(quote.validUntil)} ${daysLeft(quote.validUntil) === 1 ? 'day' : 'days'} left). Stock is checked when you place the order.`}
          action={<Link to={`/quotation-checkout/${quote._id}`} className="btn-primary !py-2 no-underline">Accept and place order</Link>} />
      )}
      {quote.status === 'expired' && <Alert type="warning" showIcon message="This quotation has expired" description={`It was valid until ${formatDate(quote.validUntil)}. Send a new request and we will quote again.`} action={<Link to="/quote" className="btn-outline !py-2 no-underline">New quote request</Link>} />}
      {quote.status === 'rejected' && <Alert type="error" showIcon message="We could not quote this request" description={quote.rejectionReason ?? 'Please contact us to talk about alternatives.'} action={<Link to="/contact" className="btn-outline !py-2 no-underline">Contact us</Link>} />}
      {quote.status === 'converted' && quote.order && <Alert type="success" showIcon message="You ordered from this quotation" action={<Link to={`/account/orders/${quote.order}`} className="btn-primary !py-2 no-underline">View order</Link>} />}

      {quote.adminNote && <section className="surface p-5" aria-labelledby="msg"><h2 id="msg" className="text-lg mb-1">Message from us</h2><p className="m-0 text-ink/80">{quote.adminNote}</p></section>}
      <QuotationSummaryView quote={quote} />
      {quote.notes && <section className="surface p-5" aria-labelledby="yn"><h2 id="yn" className="text-lg mb-1">Your notes</h2><p className="m-0 text-ink/80 whitespace-pre-line">{quote.notes}</p></section>}

      <div className="flex flex-wrap gap-3">
        {quote.status === 'approved' && <Button type="primary" onClick={() => navigate(`/quotation-checkout/${quote._id}`)}>Accept and place order</Button>}
        {cancellable && <Button danger onClick={confirmCancel}>{quote.status === 'requested' ? 'Withdraw request' : 'Decline quotation'}</Button>}
        <Link to="/contact" className="btn-outline no-underline">Questions about this quote?</Link>
      </div>
    </div>
  );
}
