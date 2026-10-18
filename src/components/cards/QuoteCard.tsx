import type { Quote } from '../../types/market';

export function QuoteCard({ quote }: { quote: Quote }) {
  const direction = quote.change >= 0 ? 'up' : 'down';
  const sign = quote.change >= 0 ? '+' : '';
  return (
    <article className="card quote-card" aria-label={`${quote.symbol} quote`}>
      <h3>
        {quote.symbol} <span className="muted">{quote.name}</span>
      </h3>
      <p className="quote-card__price">
        {quote.price.toLocaleString(undefined, { style: 'currency', currency: quote.currency })}
      </p>
      <p className={`quote-card__change quote-card__change--${direction}`}>
        {sign}
        {quote.change.toFixed(2)} ({sign}
        {quote.changePct.toFixed(2)}%)
      </p>
    </article>
  );
}
