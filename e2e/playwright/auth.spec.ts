import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox').first().fill('Testing');

    await page.getByRole('textbox').nth(1).fill('Test@123');

    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('**/projects*');
    await page.waitForLoadState('networkidle');

    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});