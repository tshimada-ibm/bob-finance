import type { PricePoint, Quote, Series } from '../../src/types/market';
import { ApiError } from './errors';

/** The subset of Yahoo's `quote()` result the app relies on. Everything is optional: Yahoo omits fields freely. */
export interface RawQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: Date;
}

/** The subset of one Yahoo `chart()` bar the app relies on. */
export interface RawBar {
  date: Date;
  close: number | null;
}

const round = (n: number, digits = 2) => Number(n.toFixed(digits));

const isFiniteNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function normalizeQuote(raw: RawQuote): Quote {
  if (!isFiniteNumber(raw.regularMarketPrice)) {
    throw new ApiError('UPSTREAM_ERROR', `No price is currently available for ${raw.symbol}.`);
  }
  return {
    symbol: raw.symbol.toUpperCase(),
    name: raw.shortName ?? raw.longName ?? raw.symbol,
    price: round(raw.regularMarketPrice),
    change: isFiniteNumber(raw.regularMarketChange) ? round(raw.regularMarketChange) : 0,
    changePct: isFiniteNumber(raw.regularMarketChangePercent) ? round(raw.regularMarketChangePercent) : 0,
    currency: raw.currency ?? 'USD',
    asOf: (raw.regularMarketTime ?? new Date()).toISOString(),
  };
}

/** Calendar date (YYYY-MM-DD) of an instant in the exchange's time zone. */
function sessionKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export interface NormalizeSeriesOptions {
  /** IANA zone of the exchange, e.g. "America/New_York". Defaults to UTC. */
  timeZone?: string;
  lastSessionOnly?: boolean;
}

/**
 * Turns raw Yahoo bars into the stable `Series` shape the UI consumes:
 * null/invalid bars dropped, ascending order, one point per timestamp, optionally one trading session only.
 */
export function normalizeSeries(symbol: string, bars: RawBar[], options: NormalizeSeriesOptions = {}): Series {
  const { timeZone = 'UTC', lastSessionOnly = false } = options;

  const byTime = new Map<number, number>();
  for (const bar of bars) {
    const time = bar.date instanceof Date ? bar.date.getTime() : NaN;
    if (Number.isNaN(time) || !isFiniteNumber(bar.close)) continue;
    byTime.set(time, bar.close); // a later duplicate wins
  }

  let times = [...byTime.keys()].sort((a, b) => a - b);
  if (lastSessionOnly && times.length > 0) {
    const lastKey = sessionKey(new Date(times[times.length - 1]), timeZone);
    times = times.filter((t) => sessionKey(new Date(t), timeZone) === lastKey);
  }

  const points: PricePoint[] = times.map((t) => ({ t: new Date(t).toISOString(), close: round(byTime.get(t)!) }));
  return { symbol: symbol.toUpperCase(), points };
}
