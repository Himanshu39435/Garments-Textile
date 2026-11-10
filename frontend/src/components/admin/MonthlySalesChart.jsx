import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatCurrency';

const shortMonth = (label) => label.split(' ')[0].slice(0, 3);

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-line p-3 shadow-card text-sm">
      <p className="m-0 font-semibold text-primary">{row.month}</p>
      <p className="m-0">{formatCurrency(row.revenue)}</p>
      <p className="m-0 text-ink/60">{row.orders} {row.orders === 1 ? 'order' : 'orders'}</p>
    </div>
  );
}

/** Revenue per month for the last 12 months (current month highlighted). Includes a text alternative for screen readers. */
export default function MonthlySalesChart({ data }) {
  const total = data.reduce((s, r) => s + r.revenue, 0);
  return (
    <figure className="m-0">
      <div role="img" aria-label={`Monthly revenue for the last 12 months, ${formatCurrency(total)} in total. Exact figures are in the table below the chart.`} className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E4DFD3" />
            <XAxis dataKey="month" tickFormatter={shortMonth} tickLine={false} axisLine={{ stroke: '#E4DFD3' }} interval="preserveStartEnd" minTickGap={6} tick={{ fontSize: 12, fill: '#252525' }} />
            <YAxis tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} width={56} tick={{ fontSize: 12, fill: '#252525' }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(184,154,101,0.12)' }} />
            <Bar dataKey="revenue" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {data.map((row, i) => <Cell key={row.month} fill={i === data.length - 1 ? '#B89A65' : '#142B3B'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-primary">View as table</summary>
        <div className="table-scroll mt-2">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">Revenue and orders by month</caption>
            <thead><tr><th className="p-2 border-b border-line">Month</th><th className="p-2 border-b border-line text-right">Revenue</th><th className="p-2 border-b border-line text-right">Orders</th></tr></thead>
            <tbody>{data.map((r) => <tr key={r.month}><td className="p-2 border-b border-line">{r.month}</td><td className="p-2 border-b border-line text-right">{formatCurrency(r.revenue)}</td><td className="p-2 border-b border-line text-right">{r.orders}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
