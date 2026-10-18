import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildComparisonRows } from '../../domain/metrics';
import type { Company, Series, TimeWindow } from '../../types/market';

interface ComparisonLineChartProps {
  series: Series[];
  companies: Company[];
  window: TimeWindow;
  height?: number;
}

function formatTick(iso: string, window: TimeWindow) {
  const d = new Date(iso);
  return window === 'day'
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Multi-series line chart; every series is rebased to 100 so different price levels compare fairly. */
export function ComparisonLineChart({ series, companies, window, height = 320 }: ComparisonLineChartProps) {
  const rows = buildComparisonRows(series);
  const label = `Relative performance (start = 100) for ${series.map((s) => s.symbol).join(', ')}`;

  return (
    <div role="img" aria-label={label} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={(t: string) => formatTick(t, window)} minTickGap={32} />
          <YAxis domain={['auto', 'auto']} width={48} />
          <Tooltip labelFormatter={(t: string) => new Date(t).toLocaleString()} />
          <Legend />
          {series.map((s) => {
            const company = companies.find((c) => c.symbol === s.symbol);
            return (
              <Line
                key={s.symbol}
                type="monotone"
                dataKey={s.symbol}
                name={company?.name ?? s.symbol}
                stroke={company?.color ?? '#525252'}
                strokeWidth={company?.primary ? 3 : 1.5}
                dot={false}
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
