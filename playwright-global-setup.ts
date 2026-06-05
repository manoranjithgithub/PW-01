import { chromium, FullConfig } from '@playwright/test';
import { envConfig } from './e2e/playwright/env';

async function globalSetup(config: FullConfig) {
  const baseURL = `http://localhost:4200/`;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 👉 Go to app
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

  // 👉 Wait for page to stabilize
  await page.waitForLoadState('networkidle');

  try {
    // 👉 Wait for login form (if not already logged in)
    const usernameInput = page.getByRole('textbox').first();
    await usernameInput.waitFor({ state: 'visible', timeout: 15000 });

    // 👉 Fill login details
    await usernameInput.fill('Testing');
    await page.getByRole('textbox').nth(1).fill('Test@123');

    // 👉 Click login
    await page.getByRole('button', { name: /login/i }).click();

    // 👉 Wait for navigation after login
    await page.waitForURL('**/projects*', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

  } catch (err) {
    console.log('⚠️ Login step skipped (already logged in or different UI)');
  }

  // 👉 Save session
  await context.storageState({ path: 'playwright/.auth/user.json' });

  await browser.close();
}

export default globalSetup;