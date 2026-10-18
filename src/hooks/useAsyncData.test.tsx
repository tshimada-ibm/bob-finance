import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsyncData } from './useAsyncData';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsyncData', () => {
  it('goes from loading to data', async () => {
    const { result } = renderHook(() => useAsyncData(async () => 'ok', 'k'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toMatchObject({ data: 'ok', error: undefined });
  });

  it('exposes the error and recovers on reload', async () => {
    let attempt = 0;
    const load = async () => {
      if (++attempt === 1) throw new Error('first attempt fails');
      return 'recovered';
    };
    const { result } = renderHook(() => useAsyncData(load, 'k'));

    await waitFor(() => expect(result.current.error?.message).toBe('first attempt fails'));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toBe('recovered'));
    expect(result.current.error).toBeUndefined();
  });

  it('ignores a slow response that arrives after the key changed', async () => {
    const slow = deferred<string>();
    const loaders: Record<string, () => Promise<string>> = {
      a: () => slow.promise,
      b: async () => 'fresh',
    };
    const { result, rerender } = renderHook(({ key }) => useAsyncData(() => loaders[key](), key), {
      initialProps: { key: 'a' },
    });

    rerender({ key: 'b' });
    await waitFor(() => expect(result.current.data).toBe('fresh'));

    await act(async () => slow.resolve('stale'));
    expect(result.current.data).toBe('fresh');
  });

  it('aborts the in-flight request when the key changes or the hook unmounts', async () => {
    const signals: AbortSignal[] = [];
    const load = (signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<string>(() => {});
    };
    const { rerender, unmount } = renderHook(({ key }) => useAsyncData(load, key), { initialProps: { key: 'a' } });

    rerender({ key: 'b' });
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    unmount();
    expect(signals[1].aborted).toBe(true);
  });

  it('keeps showing the previous data while a new key is loading', async () => {
    const next = deferred<string>();
    const { result, rerender } = renderHook(
      ({ key }) => useAsyncData(() => (key === 'a' ? Promise.resolve('A') : next.promise), key),
      { initialProps: { key: 'a' } },
    );
    await waitFor(() => expect(result.current.data).toBe('A'));

    rerender({ key: 'b' });

    expect(result.current).toMatchObject({ data: 'A', loading: true });
    await act(async () => next.resolve('B'));
    expect(result.current).toMatchObject({ data: 'B', loading: false });
  });
});
