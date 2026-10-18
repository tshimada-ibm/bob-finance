import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());

// jsdom has no layout, so ResponsiveContainer would measure 0x0 and warn. Give charts a fixed size in tests.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      cloneElement(children, { width: 800, height: 320 } as object),
  };
});
