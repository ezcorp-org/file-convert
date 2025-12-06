import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Run tests serially to avoid concurrency issues
  fullyParallel: false,
  workers: 1,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ['**/basic-*.spec.ts', '**/ui-*.spec.ts'], // Run only basic tests on Firefox
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/basic-*.spec.ts'], // Run only basic tests on WebKit
    },
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
    timeout: 120 * 1000,
    ignoreHTTPSErrors: true,
  },
});