import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatCurrency';


/** Taxable sales per fabric category, largest first. */
export default function CategorySalesChart({ data }) {
  if (!data.length) return <p className="m-0 text-ink/60">No paid sales in the last 12 months yet.</p>;
  const rows = data.map((r) => ({ ...r, name: r.category.replace(' Fabrics', '') }));
  return (
    <div role="img" aria-label={`Sales by category: ${rows.map((r) => `${r.name} ${formatCurrency(r.revenue)}`).join(', ')}`} style={{ height: Math.max(rows.length * 44 + 30, 160) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#E4DFD3" />
          <XAxis type="number" tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#252525' }} />
          <YAxis type="category" dataKey="name" width={84} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#252525' }} />
          <Tooltip formatter={(v) => formatCurrency(v)} cursor={{ fill: 'rgba(184,154,101,0.12)' }} />
          <Bar dataKey="revenue" fill="#142B3B" radius={[0, 2, 2, 0]} isAnimationActive={false} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
