import { TESTIMONIALS } from '@/pages/home/homeContent';

export default function Testimonials() {
  const [featured, ...others] = TESTIMONIALS;
  return (
    <section className="container-page pt-24">
      <h2 className="text-3xl md:text-4xl mb-8">Reordered season after season</h2>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <figure className="surface p-8 md:p-10 m-0">
          <blockquote className="m-0 font-display text-2xl md:text-3xl text-primary leading-snug">{featured.quote}</blockquote>
          <figcaption className="mt-6 text-ink/70">{featured.name}, {featured.role}</figcaption>
        </figure>
        <div className="grid gap-6">
          {others.map((t) => (
            <figure key={t.quote} className="surface p-6 m-0">
              <blockquote className="m-0 text-ink">{t.quote}</blockquote>
              <figcaption className="mt-3 text-sm text-ink/70">{t.name}, {t.role}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
