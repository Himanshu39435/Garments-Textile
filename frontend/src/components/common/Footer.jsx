import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import useCategoryList from '@/hooks/useCategoryList';
import { BRAND, CONTACT } from '@/utils/constants';

const linkClass = 'text-white/75 no-underline hover:text-accent-light';

export default function Footer() {
  const categories = useCategoryList();
  return (
    <footer className="weave text-white mt-24">
      <div className="container-page py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl text-white m-0">{BRAND.name}</p>
          <p className="mt-3 text-white/75 max-w-xs">{BRAND.tagline}. Clear specifications, bulk slabs and GST invoices on every order.</p>
        </div>
        <nav aria-label="Fabric categories">
          <h2 className="!text-white text-lg mb-3">Fabrics</h2>
          <ul className="list-none m-0 p-0 space-y-2">
            {categories.map((c) => <li key={c.slug}><Link className={linkClass} to={`/category/${c.slug}`}>{c.name}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Company">
          <h2 className="!text-white text-lg mb-3">Company</h2>
          <ul className="list-none m-0 p-0 space-y-2">
            <li><Link className={linkClass} to="/about">About us</Link></li>
            <li><Link className={linkClass} to="/contact">Contact</Link></li>
            <li><Link className={linkClass} to="/quote">Request a quote</Link></li>
            <li><Link className={linkClass} to="/login">Sign in</Link></li>
            <li><Link className={linkClass} to="/register">Create account</Link></li>
          </ul>
        </nav>
        <address className="not-italic">
          <h2 className="!text-white text-lg mb-3">Reach us</h2>
          <p className="m-0 text-white/75">{CONTACT.address}</p>
          <p className="mt-3 mb-0"><a className={linkClass} href={CONTACT.phoneHref}>{CONTACT.phone}</a></p>
          <p className="mt-1 mb-0"><a className={linkClass} href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
          <p className="mt-1 mb-0"><a className={`${linkClass} inline-flex items-center gap-2`} href={`${CONTACT.whatsappHref}?text=Hello%20Narang%20Textile`} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp support</a></p>
          <p className="mt-3 mb-0 text-white/75">{CONTACT.hours}</p>
        </address>
      </div>
      <div className="border-t border-white/15">
        <div className="container-page py-4 flex flex-col gap-1 md:flex-row md:justify-between text-sm text-white/65">
          <span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
          <span>GSTIN: {CONTACT.gstin}</span>
        </div>
      </div>
    </footer>
  );
}
