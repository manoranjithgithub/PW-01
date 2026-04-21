import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  testDir: 'e2e/playwright',
  globalSetup: './playwright-global-setup.ts',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 1,

  use: {
    baseURL: 'https://app.dev.nimbuz.tech',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    storageState: 'playwright/.auth/user.json',
  },

  webServer: {
    command: 'ng serve --poll 2000',
    port: 4200,
    reuseExistingServer: true,
    timeout: 300 * 1000,
  },

  projects: [
    /* Test against desktop browsers */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    /* Test against branded browsers. */
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' }, // or 'chrome-beta'
    },
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' }, // or 'msedge-dev'
    },
  ],

}); 