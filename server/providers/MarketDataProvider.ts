import type { Quote, Series, TimeWindow } from '../../src/types/market';

/**
 * Server-side data source contract. Implementations must return normalized data
 * (see server/lib/normalize.ts) and throw `ApiError` for expected failures.
 * Results are returned in the same order as the requested symbols.
 */
export interface MarketDataProvider {
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getHistory(symbols: string[], window: TimeWindow): Promise<Series[]>;
}
