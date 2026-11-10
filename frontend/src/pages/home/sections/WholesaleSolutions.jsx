import { Link } from 'react-router-dom';
import { BULK_SLABS } from '@/pages/home/homeContent';

export default function WholesaleSolutions() {
  return (
    <section className="mt-24 weave text-white">
      <div className="container-page py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="!text-white text-3xl md:text-4xl">Plan your wholesale production with confidence</h2>
          <p className="mt-4 text-white/80 max-w-lg">
            Tell us your product line, design, size mix, colours and quantity. We will prepare a clear quote for PNT, Kurti or a complete 3-piece Kurti Set.
          </p>
          <Link to="/quote" className="btn-accent mt-6 no-underline">Request a quotation</Link>
        </div>
        <div className="bg-white text-ink rounded-fabric overflow-hidden">
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Wholesale product lines</caption>
              <thead className="bg-secondary text-primary">
                <tr><th className="p-4 font-semibold">Product line</th><th className="p-4 font-semibold">Wholesale planning</th></tr>
              </thead>
              <tbody>
                {BULK_SLABS.map((s) => (
                  <tr key={s.range} className="border-t border-line"><td className="p-4">{s.range}</td><td className="p-4">{s.rate}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m-0 px-4 py-3 text-sm text-ink/60 border-t border-line">Illustrative slabs. Actual rates are set per product.</p>
        </div>
      </div>
    </section>
  );
}
