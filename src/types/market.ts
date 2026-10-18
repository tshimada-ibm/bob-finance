export type TimeWindow = 'day' | 'week' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
  color: string;
  /** Drawn with a heavier line in charts (the company the dashboard is "about"). */
  primary?: boolean;
  /** Starting price for the offline mock data source only; ignored by the live Yahoo source. */
  mockBasePrice?: number;
  /** Offline mock only: the symbol is valid but has no price history (exercises the "no data" UI). */
  mockNoData?: boolean;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  /** ISO-8601 UTC timestamp of the quote. */
  asOf: string;
}

export interface PricePoint {
  /** ISO-8601 UTC timestamp. */
  t: string;
  close: number;
}

export interface Series {
  symbol: string;
  points: PricePoint[];
}
