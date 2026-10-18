import type { ReactNode } from 'react';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: Error;
  empty?: boolean;
  /** Shown instead of the generic "No data available." when `empty` is set. */
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/** Reusable card chrome: owns the title plus loading / error / empty rendering around any chart. */
export function ChartCard({ title, subtitle, loading, error, empty, emptyMessage, onRetry, children }: ChartCardProps) {
  let body: ReactNode = children;
  if (error) body = <ErrorState message={error.message} onRetry={onRetry} />;
  else if (loading) body = <LoadingState />;
  else if (empty) body = <EmptyState message={emptyMessage} />;

  return (
    <section className="card chart-card" aria-label={title}>
      <header className="card__header">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>
      <div className="card__body">{body}</div>
    </section>
  );
}
