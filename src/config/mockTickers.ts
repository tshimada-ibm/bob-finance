import type { Company } from '../types/market';

/**
 * Extra tickers the offline mock source recognises, so the "look up a company" feature can be demoed
 * without Yahoo. Not used by the live source, which accepts any real ticker.
 * NODATA is a valid ticker with no price history, to demonstrate the no-data message.
 */
export const MOCK_EXTRA_COMPANIES: Company[] = [
  { symbol: 'NVDA', name: 'NVIDIA', color: '#393939', mockBasePrice: 180 },
  { symbol: 'AAPL', name: 'Apple', color: '#393939', mockBasePrice: 230 },
  { symbol: 'GOOGL', name: 'Alphabet', color: '#393939', mockBasePrice: 190 },
  { symbol: 'AMZN', name: 'Amazon', color: '#393939', mockBasePrice: 210 },
  { symbol: 'ACN', name: 'Accenture', color: '#393939', mockBasePrice: 320 },
  { symbol: 'NODATA', name: 'No-data example', color: '#393939', mockNoData: true },
];
