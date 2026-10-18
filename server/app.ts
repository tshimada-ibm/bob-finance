import express, { type ErrorRequestHandler, type Express } from 'express';
import { ApiError } from './lib/errors';
import { parseSymbols, parseWindow } from './lib/validate';
import type { MarketDataProvider } from './providers/MarketDataProvider';

/** Builds the HTTP app. The provider is injected, so tests can use a fake and production can add caching. */
export function createApp(provider: MarketDataProvider): Express {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/quotes', async (req, res) => {
    res.json(await provider.getQuotes(parseSymbols(req.query.symbols)));
  });

  app.get('/api/history', async (req, res) => {
    const symbols = parseSymbols(req.query.symbols);
    const window = parseWindow(req.query.window);
    res.json(await provider.getHistory(symbols, window));
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ code: 'BAD_REQUEST', message: 'Unknown API route.' });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError) {
      res.status(err.status).json({ code: err.code, message: err.message });
      return;
    }
    console.error(err);
    res.status(502).json({ code: 'UPSTREAM_ERROR', message: 'Unexpected error while loading market data.' });
  };
  app.use(onError);

  return app;
}
