import type { PricePoint, Series } from '../types/market';

/** Percent change from the first to the last close. Returns 0 for series with fewer than 2 points. */
export function percentChange(points: PricePoint[]): number {
  if (points.length < 2 || points[0].close === 0) return 0;
  return ((points[points.length - 1].close - points[0].close) / points[0].close) * 100;
}

/** One row per timestamp; each symbol's value is rebased so its first close equals 100. */
export type ComparisonRow = { t: string } & Record<string, number | string>;

export function buildComparisonRows(series: Series[]): ComparisonRow[] {
  const rows = new Map<string, ComparisonRow>();
  for (const s of series) {
    if (s.points.length === 0 || s.points[0].close === 0) continue;
    const base = s.points[0].close;
    for (const p of s.points) {
      const row = rows.get(p.t) ?? ({ t: p.t } as ComparisonRow);
      row[s.symbol] = Number(((p.close / base) * 100).toFixed(2));
      rows.set(p.t, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.t.localeCompare(b.t));
}
