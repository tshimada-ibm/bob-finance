import type { TimeWindow } from '../../src/types/market';

export type ChartInterval = '5m' | '30m' | '1d';

export interface WindowQuery {
  /** Start of the range requested from Yahoo. */
  from: (now: Date) => Date;
  interval: ChartInterval;
  /** Keep only the most recent trading session of the fetched range. */
  lastSessionOnly: boolean;
  /** How long a cached response stays fresh. */
  ttlMs: number;
}

const DAY_MS = 86_400_000;

/**
 * Single place that maps a UI time window to a Yahoo `chart()` query.
 * To add or retune a window, extend `TimeWindow` in src/types/market.ts and add an entry here.
 */
export const WINDOW_QUERIES: Record<TimeWindow, WindowQuery> = {
  // 5 days of 5-minute bars guarantees at least one full session across weekends and holidays.
  day: { from: (now) => new Date(now.getTime() - 5 * DAY_MS), interval: '5m', lastSessionOnly: true, ttlMs: 60_000 },
  week: { from: (now) => new Date(now.getTime() - 7 * DAY_MS), interval: '30m', lastSessionOnly: false, ttlMs: 5 * 60_000 },
  quarter: {
    from: (now) => {
      const d = new Date(now.getTime());
      d.setUTCMonth(d.getUTCMonth() - 3);
      return d;
    },
    interval: '1d',
    lastSessionOnly: false,
    ttlMs: 15 * 60_000,
  },
};
