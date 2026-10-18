import { HttpMarketDataClient } from './httpMarketDataClient';
import type { MarketDataClient } from './marketDataClient';
import { MockMarketDataClient } from './mockMarketDataClient';

export { MarketDataError, type MarketDataClient } from './marketDataClient';

/** Selects the data source from VITE_DATA_SOURCE ("mock" by default, or "http"). */
export function createMarketDataClient(source: string = import.meta.env.VITE_DATA_SOURCE ?? 'mock'): MarketDataClient {
  return source === 'http' ? new HttpMarketDataClient() : new MockMarketDataClient();
}
