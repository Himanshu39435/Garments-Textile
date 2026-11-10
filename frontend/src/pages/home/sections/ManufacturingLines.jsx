import { Link } from 'react-router-dom';
import { Scissors, Shirt, Sparkles } from 'lucide-react';

const LINES = [
  { title: 'PNT', subtitle: 'Wholesale bottoms', text: 'Production-ready PNT with dependable cutting, stitching and finishing for repeat wholesale orders.', icon: Scissors },
  { title: 'Kurti', subtitle: 'Everyday to occasion wear', text: 'Wholesale Kurtis developed for your size mix, colour requirements and collection plans.', icon: Shirt },
  { title: 'KP', subtitle: 'Kurti Pant set', text: 'Coordinated Kurti and matching Pant sets for buyers who want a ready two-piece collection.', icon: Shirt },
  { title: 'Kurti Set', subtitle: 'Complete 3-piece set', text: 'Kurti + PNT + Dupatta packed as one coordinated set for a complete retail-ready offering.', icon: Sparkles },
];

export default function ManufacturingLines() {
  return (
    <section className="container-page pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="m-0 text-sm uppercase tracking-[.16em] text-accent-dark">Our wholesale range</p>
          <h2 className="mt-2 text-3xl md:text-4xl">Made for your next collection</h2>
        </div>
        <Link to="/quote" className="text-primary font-semibold">Start a wholesale enquiry</Link>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {LINES.map(({ title, subtitle, text, icon: Icon }) => (
          <article key={title} className="surface p-6 md:p-8">
            <div className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-accent-dark"><Icon size={24} aria-hidden="true" /></div>
            <p className="mt-7 mb-1 text-sm text-accent-dark font-semibold">{subtitle}</p>
            <h3 className="text-2xl">{title}</h3>
            <p className="mt-3 mb-0 text-ink/70">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
