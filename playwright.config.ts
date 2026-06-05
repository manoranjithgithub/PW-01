import { defineConfig, devices } from '@playwright/test';
import { envConfig } from './e2e/playwright/env';

export default defineConfig({

  reporter: process.env.CI ? [
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['html', { open: 'never' }],
  ] : undefined,

  testDir: 'e2e/playwright',
  testIgnore: ['**/auth.spec.ts'],
  globalSetup: './playwright-global-setup.ts',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 1,

  use: {
    baseURL: `http://localhost:4200/`,
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    storageState: 'playwright/.auth/user.json',
  },

  webServer: {
    command: 'npm run local',
    url: 'http://localhost:4200/',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },

  projects: [
    /* Test against desktop browsers */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
    // /* Test against branded browsers. */
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' }, // or 'chrome-beta'
    // },
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' }, // or 'msedge-dev'
    // },
  ]

}); 
