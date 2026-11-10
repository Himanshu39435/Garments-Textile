import { BUSINESS_STATS } from '@/pages/home/homeContent';

export default function BusinessStats() {
  return (
    <section aria-label="Business statistics" className="bg-white border-b border-line">
      <dl className="container-page grid grid-cols-2 md:grid-cols-4 m-0">
        {BUSINESS_STATS.map((s) => (
          <div key={s.label} className="py-6 px-2 md:px-6 md:border-r last:border-r-0 border-line">
            <dd className="m-0 font-display text-3xl md:text-4xl text-primary">{s.value}</dd>
            <dt className="text-sm text-ink/70">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
