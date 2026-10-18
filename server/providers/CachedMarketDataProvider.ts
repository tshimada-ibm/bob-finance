import type { Quote, Series, TimeWindow } from '../../src/types/market';
import { WINDOW_QUERIES } from '../lib/windows';
import type { MarketDataProvider } from './MarketDataProvider';

const QUOTE_TTL_MS = 60_000;

interface Entry {
  expires: number;
  value: Promise<unknown>;
}

/**
 * Decorator adding a short TTL cache (with in-flight de-duplication) to any provider,
 * to stay well under Yahoo's informal rate limits. Failed loads are not cached.
 */
export class CachedMarketDataProvider implements MarketDataProvider {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly inner: MarketDataProvider,
    private readonly clock: () => number = Date.now,
  ) {}

  private remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expires > this.clock()) return hit.value as Promise<T>;

    const value = load();
    this.entries.set(key, { expires: this.clock() + ttlMs, value });
    value.catch(() => {
      if (this.entries.get(key)?.value === value) this.entries.delete(key);
    });
    return value;
  }

  getQuotes(symbols: string[]): Promise<Quote[]> {
    return this.remember(`quotes:${symbols.join(',')}`, QUOTE_TTL_MS, () => this.inner.getQuotes(symbols));
  }

  getHistory(symbols: string[], window: TimeWindow): Promise<Series[]> {
    return this.remember(`history:${window}:${symbols.join(',')}`, WINDOW_QUERIES[window].ttlMs, () =>
      this.inner.getHistory(symbols, window),
    );
  }
}
