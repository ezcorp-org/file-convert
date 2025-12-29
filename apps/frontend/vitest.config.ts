import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: false })],
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
      '$app/stores': path.resolve('./src/lib/mocks/app-stores.ts'),
      '$app/navigation': path.resolve('./src/lib/mocks/app-navigation.ts'),
    }
  }
});