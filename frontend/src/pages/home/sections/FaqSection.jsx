import { Collapse } from 'antd';
import { FAQS } from '@/pages/home/homeContent';

export default function FaqSection() {
  const items = FAQS.map((f, i) => ({ key: String(i), label: <span className="font-semibold text-primary">{f.q}</span>, children: <p className="m-0 text-ink/80">{f.a}</p> }));
  return (
    <section className="container-page pt-24 grid lg:grid-cols-[1fr_1.6fr] gap-10">
      <h2 className="text-3xl md:text-4xl">Questions before your first order</h2>
      <Collapse accordion ghost items={items} expandIconPosition="end" className="border-t border-line" />
    </section>
  );
}
