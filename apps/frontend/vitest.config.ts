import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.{test,spec}.{js,ts}', 'tests/fixtures/**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/*.spec.ts', 'tests/e2e/**', 'tests/benchmarks/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app/environment': path.resolve('./src/lib/mocks/app-environment.ts'),
    }
  }
});