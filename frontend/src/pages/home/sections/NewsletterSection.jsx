import { useState } from 'react';
import { subscribeToNewsletter } from '@/services/api/newsletterApi';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus({ type: 'error', message: 'Enter a valid email address, like name@company.com.' });
      return;
    }
    setStatus({ type: 'loading', message: '' });
    try {
      const response = await subscribeToNewsletter(email.trim());
      setEmail('');
      setStatus({ type: 'success', message: response.message });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  return (
    <section className="container-page pt-24">
      <div className="surface p-6 md:p-12 grid md:grid-cols-2 gap-8 items-center">
        <div className="min-w-0">
          <h2 className="text-3xl">New fabrics and price updates, by email</h2>
          <p className="mt-3 mb-0 text-ink/75">One short email when new stock or seasonal rates arrive. Unsubscribe any time.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="min-w-0">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              aria-describedby="newsletter-status"
              className="flex-1 min-w-0 h-12 px-4 border border-line rounded-fabric bg-secondary focus:border-primary outline-none"
            />
            <button type="submit" className="btn-primary h-12" disabled={status.type === 'loading'}>
              {status.type === 'loading' ? 'Subscribing' : 'Subscribe'}
            </button>
          </div>
          <p id="newsletter-status" role="status" className={`mt-2 mb-0 text-sm min-h-5 ${status.type === 'error' ? 'text-red-700' : 'text-primary'}`}>{status.message}</p>
        </form>
      </div>
    </section>
  );
}
