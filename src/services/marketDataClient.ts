import type { Quote, Series, TimeWindow } from '../types/market';

export type MarketDataErrorCode = 'INVALID_SYMBOL' | 'UPSTREAM_ERROR' | 'NETWORK_ERROR';

export class MarketDataError extends Error {
  constructor(
    public readonly code: MarketDataErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MarketDataError';
  }
}

/**
 * The only contract the UI depends on. Implementations (mock, HTTP proxy to Yahoo Finance, ...)
 * must return normalized data: ascending timestamps, no null points.
 */
export interface MarketDataClient {
  getQuotes(symbols: string[], signal?: AbortSignal): Promise<Quote[]>;
  getHistory(symbols: string[], window: TimeWindow, signal?: AbortSignal): Promise<Series[]>;
}
