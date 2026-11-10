import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { CONTACT } from '@/utils/constants';

export default function ContactPage() {
  usePageTitle('Contact');
  const rows = [
    { icon: Phone, label: 'Phone', value: CONTACT.phone, href: CONTACT.phoneHref },
    { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with our support team', href: `${CONTACT.whatsappHref}?text=Hello%20Narang%20Textile` },
    { icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: MapPin, label: 'Address', value: CONTACT.address },
    { icon: Clock, label: 'Hours', value: CONTACT.hours },
  ];
  return (
    <div className="container-page py-14 md:py-20">
      <h1 className="text-4xl md:text-5xl">Talk to our sales team</h1>
      <p className="mt-4 text-lg text-ink/80 max-w-prose">Call or email with your fabric, quantity and delivery location. For custom or large orders, a quote request gets you fixed pricing in writing.</p>
      <dl className="mt-10 grid sm:grid-cols-2 gap-4 max-w-3xl">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="surface p-5 flex gap-4">
            <Icon size={22} className="text-accent-dark shrink-0 mt-1" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-sm text-ink/60">{label}</dt>
              <dd className="m-0 break-words">{href ? <a href={href} className="text-primary">{value}</a> : value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <Link to="/quote" className="btn-primary mt-10 no-underline">Request a quote</Link>
    </div>
  );
}
