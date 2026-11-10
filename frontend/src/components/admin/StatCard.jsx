import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

/** KPI tile. `change` (a percent, or null) adds a coloured trend line; `hint` is plain secondary text. */
export default function StatCard({ label, value, hint, change, changeLabel = 'vs last month' }) {
  const up = change > 0;
  const flat = change === 0;
  return (
    <div className="surface p-5">
      <p className="m-0 text-sm text-ink/70">{label}</p>
      <p className="mt-1 mb-0 font-display text-2xl md:text-3xl text-primary">{value}</p>
      {change !== undefined && change !== null && (
        <p className={`mt-1 mb-0 text-sm flex items-center gap-1 ${flat ? 'text-ink/60' : up ? 'text-emerald-700' : 'text-red-700'}`}>
          {!flat && (up ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />)}
          {Math.abs(change)}% {flat ? 'no change' : up ? 'up' : 'down'} {changeLabel}
        </p>
      )}
      {hint && <p className="mt-1 mb-0 text-sm text-ink/60">{hint}</p>}
    </div>
  );
}
