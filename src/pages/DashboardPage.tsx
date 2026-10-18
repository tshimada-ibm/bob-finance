import { useState } from 'react';
import { SummaryCardsRow } from '../components/cards/SummaryCardsRow';
import { ChartCard } from '../components/charts/ChartCard';
import { ComparisonLineChart } from '../components/charts/ComparisonLineChart';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { SymbolSearch } from '../components/controls/SymbolSearch';
import { TimeWindowTabs } from '../components/layout/TimeWindowTabs';
import { SelectedCompanyPanel } from '../components/panels/SelectedCompanyPanel';
import { RankingTable } from '../components/tables/RankingTable';
import { DEFAULT_COMPANIES } from '../config/companies';
import { TIME_WINDOWS } from '../config/timeWindows';
import { useHistory } from '../hooks/useHistory';
import { useQuotes } from '../hooks/useQuotes';
import type { Company, TimeWindow } from '../types/market';

export function DashboardPage({ companies = DEFAULT_COMPANIES }: { companies?: Company[] }) {
  const [window, setWindow] = useState<TimeWindow>('day');
  // User-selected extra company. Deliberately NOT part of `symbols` below: the comparison dashboard
  // keeps tracking exactly the configured companies.
  const [selectedSymbol, setSelectedSymbol] = useState<string>();
  const symbols = companies.map((c) => c.symbol);
  const quotes = useQuotes(symbols);
  const history = useHistory(symbols, window);
  const active = TIME_WINDOWS.find((w) => w.id === window)!;

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>Market Dashboard</h1>
        <p className="muted">IBM vs. competitors · demo data unless VITE_DATA_SOURCE=http</p>
      </header>

      {quotes.error ? (
        <ErrorState message={quotes.error.message} onRetry={quotes.reload} />
      ) : quotes.loading && !quotes.data ? (
        <LoadingState label="Loading quotes…" />
      ) : (
        <SummaryCardsRow quotes={quotes.data ?? []} />
      )}

      <TimeWindowTabs value={window} onChange={setWindow} />

      <ChartCard
        title={`Relative performance — ${active.label}`}
        subtitle={active.description}
        loading={history.loading && !history.data}
        error={history.error}
        empty={!history.loading && (history.data?.length ?? 0) === 0}
        onRetry={history.reload}
      >
        {history.data && (
          <>
            <ComparisonLineChart series={history.data} companies={companies} window={window} />
            <RankingTable series={history.data} companies={companies} />
          </>
        )}
      </ChartCard>

      <SymbolSearch selected={selectedSymbol} onSelect={setSelectedSymbol} onClear={() => setSelectedSymbol(undefined)} />
      {selectedSymbol && <SelectedCompanyPanel key={selectedSymbol} symbol={selectedSymbol} window={window} />}
    </main>
  );
}
