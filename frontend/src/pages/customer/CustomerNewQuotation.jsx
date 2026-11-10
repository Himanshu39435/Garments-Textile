import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import usePageTitle from '@/hooks/usePageTitle';
import useAuth from '@/hooks/useAuth';
import QuoteRequestForm from '@/components/forms/QuoteRequestForm';

/** /quote: request special pricing for a bulk order. */
export default function CustomerNewQuotation() {
  usePageTitle('Request a quote');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  return (
    <div className="container-page py-10 md:py-14 max-w-4xl">
      <h1 className="text-4xl md:text-5xl">Request a quote</h1>
      <p className="mt-3 text-ink/75 max-w-prose">Tell us what you need and in what quantity. We reply with fixed pricing, a validity date and, when it suits you, you place the order straight from the quotation.</p>
      <aside className="surface p-4 my-6 text-sm" aria-label="Your details">
        <strong className="text-primary">{user.name}</strong>{user.business?.companyName ? `, ${user.business.companyName}` : ''}<br />
        {user.business?.gstin ? <>GSTIN {user.business.gstin}</> : <>No GSTIN on file. <Link to="/account/profile">Add it to your profile</Link> so it appears on your invoice.</>}
      </aside>
      <QuoteRequestForm initialProductSlug={params.get('product') ?? undefined} onSubmitted={(quote) => { message.success('Quote request sent'); navigate(`/account/quotations/${quote._id}`); }} />
    </div>
  );
}
