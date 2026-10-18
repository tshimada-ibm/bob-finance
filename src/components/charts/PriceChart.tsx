import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint, TimeWindow } from '../../types/market';

interface PriceChartProps {
  symbol: string;
  points: PricePoint[];
  window: TimeWindow;
  color?: string;
  height?: number;
}

function formatTick(iso: string, window: TimeWindow) {
  const d = new Date(iso);
  return window === 'day'
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Single-company chart in actual price (not rebased: there is nothing to compare against). */
export function PriceChart({ symbol, points, window, color = '#005d5d', height = 280 }: PriceChartProps) {
  return (
    <div role="img" aria-label={`Price history for ${symbol}`} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={(t: string) => formatTick(t, window)} minTickGap={32} />
          <YAxis domain={['auto', 'auto']} width={56} />
          <Tooltip
            labelFormatter={(t: string) => new Date(t).toLocaleString()}
            formatter={(value: number) => [value.toFixed(2), symbol]}
          />
          <Line type="monotone" dataKey="close" name={symbol} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
