const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

/** 12345.5 -> "₹12,345.50" */
export function formatCurrency(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? inrFormatter.format(value) : '—';
}

const trim = (n) => String(Math.round(n * 10) / 10).replace(/\.0$/, '');

/** Short form for chart axes: 15000 -> "₹15K", 250000 -> "₹2.5L", 12000000 -> "₹1.2Cr" (Indian lakh/crore). */
export function formatCompactCurrency(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${trim(n / 1e7)}Cr`;
  if (abs >= 1e5) return `₹${trim(n / 1e5)}L`;
  if (abs >= 1e3) return `₹${trim(n / 1e3)}K`;
  return `₹${trim(n)}`;
}

const inrWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** Whole rupees for headline figures: 275300 -> "₹2,75,300". Use formatCurrency where paise matter. */
export function formatCurrencyWhole(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? inrWhole.format(value) : '—';
}
