import { nextSequence } from '../models/CounterModel.js';

/** Indian financial year label: April 2026 to March 2027 is "2026-27". */
export function financialYear(date = new Date()) {
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

/** NT/2026-27/000001. The counter is per financial year and never reused, so numbering has no gaps from this code. */
export async function generateInvoiceNumber(date = new Date()) {
  const fy = financialYear(date);
  const seq = await nextSequence(`invoice-${fy}`);
  return `NT/${fy}/${String(seq).padStart(6, '0')}`;
}
