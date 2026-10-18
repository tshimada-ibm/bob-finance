import { percentChange } from '../../domain/metrics';
import type { Company, Series } from '../../types/market';

/** Text equivalent of the comparison chart: companies ranked by change over the active window. */
export function RankingTable({ series, companies }: { series: Series[]; companies: Company[] }) {
  const rows = series
    .map((s) => ({
      symbol: s.symbol,
      name: companies.find((c) => c.symbol === s.symbol)?.name ?? s.symbol,
      pct: percentChange(s.points),
    }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <table className="ranking-table">
      <caption className="visually-hidden">Companies ranked by change over the selected window</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Company</th>
          <th scope="col">Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.symbol}>
            <td>{i + 1}</td>
            <td>
              {r.symbol} <span className="muted">{r.name}</span>
            </td>
            <td className={r.pct >= 0 ? 'up' : 'down'}>
              {r.pct >= 0 ? '+' : ''}
              {r.pct.toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
