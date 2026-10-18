import { createApp } from './app';
import { CachedMarketDataProvider } from './providers/CachedMarketDataProvider';
import { YahooProvider } from './providers/YahooProvider';

const port = Number(process.env.PORT ?? 3001);
const app = createApp(new CachedMarketDataProvider(new YahooProvider()));

app.listen(port, () => {
  console.log(`Market data API (Yahoo Finance) listening on http://localhost:${port}`);
});
