import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/** Whole-number stepper. Commits on +/-, Enter and blur so each change is a single request. */
export default function QuantitySelector({ value, min = 1, max, step = 10, onCommit, disabled = false, label = 'Quantity' }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const clamp = (n) => Math.min(Math.max(n, min), max ?? Infinity);
  const commit = (n) => {
    const next = Number.isFinite(n) ? clamp(Math.round(n)) : value;
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  const button = 'h-10 w-10 grid place-items-center bg-white border border-line cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="inline-flex" role="group" aria-label={label}>
      <button type="button" className={`${button} rounded-l-fabric`} aria-label="Decrease quantity" disabled={disabled || value <= min} onClick={() => commit(value - step)}><Minus size={16} /></button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={draft}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(Number(draft))}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-10 w-20 text-center border-y border-line bg-white outline-none focus:border-primary [appearance:textfield]"
      />
      <button type="button" className={`${button} rounded-r-fabric`} aria-label="Increase quantity" disabled={disabled || (max !== undefined && value >= max)} onClick={() => commit(value + step)}><Plus size={16} /></button>
    </div>
  );
}
