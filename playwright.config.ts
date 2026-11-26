import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE } from './src/data/paths';

/**
 * Playwright configuration.
 *
 * Design notes:
 *  - `testIdAttribute` is set to `data-test` because SauceDemo exposes stable
 *    `data-test` hooks. Using them keeps locators resilient to CSS/layout changes.
 *  - A `setup` project logs in once and stores the session (storageState).
 *    Every browser project depends on it, so feature tests start already
 *    authenticated instead of repeating the login UI flow in every test.
 *  - Traces/screenshots/videos are only kept for failures to keep runs fast
 *    while still giving full debugging evidence when something breaks.
 */
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: isCI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
});
