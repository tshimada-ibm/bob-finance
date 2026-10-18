import { useCallback, useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

/** Runs `load` whenever `key` changes (or `reload` is called); aborts the previous request. */
export function useAsyncData<T>(load: (signal: AbortSignal) => Promise<T>, key: string): AsyncState<T> {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ data: prev.data, loading: true }));
    load(controller.signal).then(
      (data) => !controller.signal.aborted && setState({ data, loading: false }),
      (error: Error) => !controller.signal.aborted && setState({ error, loading: false }),
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data: state.data, error: state.error, loading: state.loading, reload };
}
