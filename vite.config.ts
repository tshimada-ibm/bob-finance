import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600, // recharts alone is ~525 kB, isolated in its own chunk
    rollupOptions: {
      output: { manualChunks: { recharts: ['recharts'] } },
    },
  },
  server: {
    // When VITE_DATA_SOURCE=http, requests to /api are forwarded to a backend proxy.
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'server/index.ts', 'src/types/**'],
      // Floors, not goals: they fail the run if coverage regresses. Raise them as the suite grows.
      thresholds: { lines: 85, statements: 85, functions: 85, branches: 75 },
    },
  },
});
