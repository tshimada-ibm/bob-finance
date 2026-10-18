import { HttpMarketDataClient } from './httpMarketDataClient';
import { createMarketDataClient } from './index';
import { MockMarketDataClient } from './mockMarketDataClient';

describe('createMarketDataClient', () => {
  it('uses the offline mock client by default', () => {
    expect(createMarketDataClient('mock')).toBeInstanceOf(MockMarketDataClient);
    expect(createMarketDataClient('anything-else')).toBeInstanceOf(MockMarketDataClient);
  });

  it('uses the HTTP proxy client when the source is "http"', () => {
    expect(createMarketDataClient('http')).toBeInstanceOf(HttpMarketDataClient);
  });
});
