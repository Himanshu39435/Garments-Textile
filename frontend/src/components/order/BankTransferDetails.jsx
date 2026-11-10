import { formatCurrency } from '@/utils/formatCurrency';

const Row = ({ label, value }) => <div className="flex justify-between gap-4 py-1"><dt className="text-ink/70">{label}</dt><dd className="m-0 font-semibold text-primary text-right break-all">{value}</dd></div>;

/** Account details for bank-transfer orders. */
export default function BankTransferDetails({ order }) {
  if (!order.bankDetails) return null;
  const b = order.bankDetails;
  return (
    <section className="surface p-5 md:p-6" aria-labelledby="bank">
      <h2 id="bank" className="text-xl mb-2">Pay by bank transfer</h2>
      <p className="mt-0 text-ink/75">Transfer <strong>{formatCurrency(order.pricing.total)}</strong> and use <strong>{order.orderNumber}</strong> as the payment reference. We confirm your order when the money arrives.</p>
      <dl className="m-0 max-w-md"><Row label="Account name" value={b.accountName} /><Row label="Account number" value={b.accountNumber} /><Row label="IFSC" value={b.ifsc} /><Row label="Bank" value={b.bankName} /></dl>
    </section>
  );
}
