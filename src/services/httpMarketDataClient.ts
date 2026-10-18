import type { Quote, Series, TimeWindow } from '../types/market';
import { MarketDataError, type MarketDataClient } from './marketDataClient';

/**
 * Talks to a backend proxy that wraps Yahoo Finance (browsers cannot call Yahoo directly because of CORS).
 * Expected endpoints:
 *   GET /api/quotes?symbols=IBM,MSFT
 *   GET /api/history?symbols=IBM,MSFT&window=day|week|quarter
 * Errors: JSON body { code, message } with a non-2xx status.
 */
export class HttpMarketDataClient implements MarketDataClient {
  constructor(private readonly baseUrl = '/api') {}

  private async get<T>(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
    const url = `${this.baseUrl}${path}?${new URLSearchParams(params)}`;
    let response: Response;
    try {
      response = await fetch(url, { signal });
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
      throw new MarketDataError('NETWORK_ERROR', 'Could not reach the market data service.');
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;
      throw new MarketDataError(
        body?.code === 'INVALID_SYMBOL' ? 'INVALID_SYMBOL' : 'UPSTREAM_ERROR',
        body?.message ?? `Market data request failed (${response.status}).`,
      );
    }
    return (await response.json()) as T;
  }

  getQuotes(symbols: string[], signal?: AbortSignal): Promise<Quote[]> {
    return this.get('/quotes', { symbols: symbols.join(',') }, signal);
  }

  getHistory(symbols: string[], window: TimeWindow, signal?: AbortSignal): Promise<Series[]> {
    return this.get('/history', { symbols: symbols.join(','), window }, signal);
  }
}
