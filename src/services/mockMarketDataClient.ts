import { DEFAULT_COMPANIES } from '../config/companies';
import { MOCK_EXTRA_COMPANIES } from '../config/mockTickers';
import type { Company, PricePoint, Quote, Series, TimeWindow } from '../types/market';
import { MarketDataError, type MarketDataClient } from './marketDataClient';

const WINDOW_SHAPE: Record<TimeWindow, { count: number; stepMs: number }> = {
  day: { count: 78, stepMs: 5 * 60_000 }, // 5-minute bars over a 6.5h session
  week: { count: 35, stepMs: 4 * 3_600_000 }, // 4-hour bars
  quarter: { count: 63, stepMs: 86_400_000 }, // daily bars
};

/** Small deterministic PRNG so mock data (and tests) are stable. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  return [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
}

/** Offline, deterministic data source. Default for local development, workshops, and tests. */
export class MockMarketDataClient implements MarketDataClient {
  /** Symbols the mock knows about: exactly the configured companies. */
  private readonly companies: Map<string, Company>;

  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly latencyMs = 150,
    companies: Company[] = [...DEFAULT_COMPANIES, ...MOCK_EXTRA_COMPANIES],
  ) {
    this.companies = new Map(companies.map((c) => [c.symbol, c]));
  }

  private async delay(signal?: AbortSignal) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, this.latencyMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }

  private assertKnown(symbol: string) {
    if (!this.companies.has(symbol)) {
      throw new MarketDataError('INVALID_SYMBOL', `Unknown symbol: ${symbol}`);
    }
  }

  /** Configured base price, or a stable value derived from the symbol so new companies need no mock setup. */
  private basePrice(symbol: string): number {
    return this.companies.get(symbol)?.mockBasePrice ?? 50 + (Math.abs(hash(symbol)) % 250);
  }

  private buildPoints(symbol: string, window: TimeWindow): PricePoint[] {
    if (this.companies.get(symbol)?.mockNoData) return [];
    const { count, stepMs } = WINDOW_SHAPE[window];
    const rand = mulberry32(hash(`${symbol}:${window}`));
    const end = this.now().getTime();
    let price = this.basePrice(symbol);
    return Array.from({ length: count }, (_, i) => {
      price = Math.max(1, price * (1 + (rand() - 0.5) * 0.01));
      return {
        t: new Date(end - (count - 1 - i) * stepMs).toISOString(),
        close: Number(price.toFixed(2)),
      };
    });
  }

  async getHistory(symbols: string[], window: TimeWindow, signal?: AbortSignal): Promise<Series[]> {
    await this.delay(signal);
    return symbols.map((symbol) => {
      this.assertKnown(symbol);
      return { symbol, points: this.buildPoints(symbol, window) };
    });
  }

  async getQuotes(symbols: string[], signal?: AbortSignal): Promise<Quote[]> {
    await this.delay(signal);
    return symbols.map((symbol) => {
      this.assertKnown(symbol);
      const points = this.buildPoints(symbol, 'day');
      if (points.length === 0) {
        // Same as the live source: a symbol with no price yields no quote.
        throw new MarketDataError('UPSTREAM_ERROR', `No price is currently available for ${symbol}.`);
      }
      const first = points[0].close;
      const last = points[points.length - 1];
      return {
        symbol,
        name: this.companies.get(symbol)?.name ?? symbol,
        price: last.close,
        change: Number((last.close - first).toFixed(2)),
        changePct: Number((((last.close - first) / first) * 100).toFixed(2)),
        currency: 'USD',
        asOf: last.t,
      };
    });
  }
}
