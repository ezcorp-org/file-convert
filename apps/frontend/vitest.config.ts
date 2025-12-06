import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app/environment': path.resolve('./src/lib/mocks/app-environment.ts'),
    }
  }
});