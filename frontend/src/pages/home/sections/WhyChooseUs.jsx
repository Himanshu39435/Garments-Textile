import { WHY_CHOOSE_US } from '@/pages/home/homeContent';

export default function WhyChooseUs() {
  return (
    <section className="container-page pt-24 grid lg:grid-cols-[1fr_1.6fr] gap-10">
      <div>
        <h2 className="text-3xl md:text-4xl lg:sticky lg:top-28">Built for wholesale buyers who value consistency</h2>
      </div>
      <ul className="list-none m-0 p-0 border-t border-line">
        {WHY_CHOOSE_US.map((item) => (
          <li key={item.title} className="py-6 border-b border-line">
            <h3 className="text-xl">{item.title}</h3>
            <p className="mt-2 mb-0 text-ink/75 max-w-prose">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
