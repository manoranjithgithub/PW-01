import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {

    await page.goto('/');

    await page.getByRole('textbox').first().fill('Dev');

    await page.getByRole('textbox').nth(1).fill('Test@123');

    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('**/projects');

    await page.context().storageState({ path: 'storageState.json' });

});