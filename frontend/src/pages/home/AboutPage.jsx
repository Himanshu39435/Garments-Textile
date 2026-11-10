import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import { BRAND } from '@/utils/constants';

const PROCESS = [
  { title: 'Choose your fabric', text: 'Filter by composition, GSM, width and colour, then check the MOQ and slab rates.' },
  { title: 'Order a sample or request a quote', text: 'Test the hand-feel first, or send quantities and receive fixed pricing with a validity date.' },
  { title: 'Pay and track', text: 'Pay online or by bank transfer, then follow your order and download the GST invoice from your dashboard.' },
];

/** PLACEHOLDER story copy. Replace with the real company history. */
export default function AboutPage() {
  usePageTitle('About us');
  return (
    <div className="container-page py-14 md:py-20">
      <h1 className="text-4xl md:text-5xl max-w-3xl">{BRAND.name} supplies fabric to businesses that make things.</h1>
      <p className="mt-6 text-lg text-ink/80 max-w-prose">
        We stock cotton, printed, embroidered, linen and blended cloth for garment makers, boutiques and uniform suppliers. Every listing shows the details a buyer needs to cost a run: composition, GSM, width, minimum order and slab pricing.
      </p>
      <h2 className="text-2xl mt-14 mb-2">How ordering works</h2>
      <ol className="list-none m-0 p-0 border-t border-line max-w-3xl">
        {PROCESS.map((s, i) => (
          <li key={s.title} className="py-5 border-b border-line flex gap-5">
            <span className="font-display text-2xl text-accent-dark w-8 shrink-0">{i + 1}</span>
            <div><h3 className="text-xl">{s.title}</h3><p className="mt-1 mb-0 text-ink/75">{s.text}</p></div>
          </li>
        ))}
      </ol>
      <Link to="/products" className="btn-primary mt-10 no-underline">Browse fabrics</Link>
    </div>
  );
}
