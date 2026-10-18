import { PriceChart } from '../charts/PriceChart';
import { ChartCard } from '../charts/ChartCard';
import { percentChange } from '../../domain/metrics';
import { useHistory } from '../../hooks/useHistory';
import { MarketDataError } from '../../services';
import type { TimeWindow } from '../../types/market';
import { TIME_WINDOWS } from '../../config/timeWindows';

interface SelectedCompanyPanelProps {
  symbol: string;
  window: TimeWindow;
}

/**
 * Graph for one user-selected ticker. Self-contained: it makes its own data request, so the main
 * IBM-vs-competitors dashboard is unaffected by its loading, errors or empty results.
 *
 * Callers should render it with `key={symbol}` so that changing the ticker remounts it and
 * never shows the previous company's data under the new name.
 */
export function SelectedCompanyPanel({ symbol, window }: SelectedCompanyPanelProps) {
  const history = useHistory([symbol], window);
  const active = TIME_WINDOWS.find((w) => w.id === window)!;

  // Only ever plot a series that belongs to the requested symbol.
  const series = history.data?.find((s) => s.symbol === symbol);
  const points = series?.points ?? [];

  const unknownSymbol = history.error instanceof MarketDataError && history.error.code === 'INVALID_SYMBOL';
  const noPrices = !history.loading && !history.error && points.length < 2;
  const noData = unknownSymbol || noPrices;

  const emptyMessage = unknownSymbol
    ? `No market data found for ${symbol}. Check the ticker symbol and try again.`
    : `No price data is available for ${symbol} in this period. Try another time window or ticker.`;

  const change = percentChange(points);
  const latest = points[points.length - 1]?.close;

  return (
    <ChartCard
      title={`${symbol} price — ${active.label}`}
      subtitle={active.description}
      loading={history.loading && !series}
      error={unknownSymbol ? undefined : history.error}
      empty={noData}
      emptyMessage={emptyMessage}
      onRetry={history.reload}
    >
      {!noData && (
        <>
          <PriceChart symbol={symbol} points={points} window={window} />
          {latest !== undefined && (
            <p className="selected-summary">
              Latest {latest.toFixed(2)} ·{' '}
              <span className={change >= 0 ? 'up' : 'down'}>
                {change >= 0 ? '+' : ''}
                {change.toFixed(2)}%
              </span>{' '}
              over this period
            </p>
          )}
        </>
      )}
    </ChartCard>
  );
}
