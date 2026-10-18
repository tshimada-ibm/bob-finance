export function EmptyState({ message = 'No data available.' }: { message?: string }) {
  return <div className="state state--empty">{message}</div>;
}
