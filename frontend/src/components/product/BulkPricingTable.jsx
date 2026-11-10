import { formatCurrency } from '@/utils/formatCurrency';
import { getBulkSlabRows } from '@/utils/pricing';

/** Slab table: quantity range and per-metre rate. Renders nothing when there are no bulk slabs. */
export default function BulkPricingTable({ product }) {
  if (!product.bulkPricing?.length) return null;
  const unit = product.unit ?? 'm';
  return (
    <div className="table-scroll border border-line rounded-fabric">
      <table className="w-full text-left border-collapse bg-white">
        <caption className="sr-only">Bulk pricing for {product.name}</caption>
        <thead className="bg-secondary text-primary"><tr><th className="p-3 font-semibold">Quantity</th><th className="p-3 font-semibold">Rate per {unit}</th></tr></thead>
        <tbody>
          {getBulkSlabRows(product).map((row) => (
            <tr key={row.from} className="border-t border-line">
              <td className="p-3">{row.to ? `${row.from} to ${row.to} ${unit}` : `${row.from} ${unit} and above`}</td>
              <td className="p-3 font-semibold text-primary">{formatCurrency(row.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
