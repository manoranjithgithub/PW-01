import { chromium, FullConfig } from '@playwright/test';
import { envConfig } from './e2e/playwright/env';

async function globalSetup(config: FullConfig) {
    const baseURL = `https://app.${envConfig.domain}`;
    const browser = await chromium.launch();
    const page = await browser.newPage({ baseURL });

    await page.goto('/projects');

    try {
        const loginButton = page.locator('button:has-text("Login")');
        await loginButton.waitFor({ state: 'visible', timeout: 60000 });

        await page.getByRole('textbox').first().fill('Testing');
        await page.getByRole('textbox').nth(1).fill('Test@123');
        await page.getByRole('button', { name: /login/i }).click();

        await page.waitForURL('**/projects*');
        await page.waitForLoadState('networkidle');
    } catch (error) {
        console.log('Login form not found, might already have a session active or different setup.');
    }

    await page.context().storageState({ path: 'playwright/.auth/user.json' });
    await browser.close();
}

export default globalSetup;
