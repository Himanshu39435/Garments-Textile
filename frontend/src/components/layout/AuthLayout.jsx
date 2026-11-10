/** Two-panel shell for login, register, OTP and password pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="container-page py-10 md:py-16">
      <div className="grid lg:grid-cols-[1fr_1.1fr] surface overflow-hidden">
        <aside className="weave text-white p-8 md:p-12 hidden lg:flex flex-col justify-between">
          <div>
            <p className="font-display text-3xl text-white m-0 leading-tight">Wholesale fabric, managed in one place.</p>
            <ul className="mt-8 space-y-3 list-none p-0 text-white/85">
              <li>Bulk slab pricing and quotations</li>
              <li>GST invoices with your GSTIN</li>
              <li>Order tracking and reorders</li>
            </ul>
          </div>
          <p className="m-0 text-sm text-white/60">NARANG TEXTILE</p>
        </aside>
        <div className="p-6 md:p-12">
          <h1 className="text-3xl md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 mb-6 text-ink/70">{subtitle}</p>}
          {children}
          {footer && <div className="mt-6 text-ink/80">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
