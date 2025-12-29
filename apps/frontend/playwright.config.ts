import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',  // Only match .spec.ts files (E2E tests)
  testIgnore: ['**/fixtures/**/*.test.ts', '**/unit/**/*.test.ts', '**/benchmarks/**'],  // Ignore vitest unit tests
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    // Primary: Full test suite on Chromium
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Secondary: Smoke tests only on Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*smoke.*\.spec\.ts/, // Only run smoke tests on Firefox
    },
    // Secondary: Smoke tests only on WebKit
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*smoke.*\.spec\.ts/, // Only run smoke tests on WebKit
    },
    // Mobile browsers (placeholder for future mobile-specific tests)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/mobile-*.spec.ts'], // Run only mobile-specific tests
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: ['**/mobile-*.spec.ts'], // Run only mobile-specific tests
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: process.env.CI ? 180 * 1000 : 120 * 1000,
    ignoreHTTPSErrors: true,
  },
});