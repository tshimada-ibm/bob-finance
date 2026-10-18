import type { Quote } from '../../types/market';
import { QuoteCard } from './QuoteCard';

export function SummaryCardsRow({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="summary-row">
      {quotes.map((q) => (
        <QuoteCard key={q.symbol} quote={q} />
      ))}
    </div>
  );
}
