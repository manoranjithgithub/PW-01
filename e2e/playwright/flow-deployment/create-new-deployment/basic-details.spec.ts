import { test, expect, Page } from '@playwright/test';

test.describe('Create New Deployment - ZIP Upload (Vue.js App)', () => {

    test.slow();

    const ZIP_FILE_URL = 'https://nimbuz-users-artifacts.s3.ap-southeast-1.amazonaws.com/UI-Automation/vuejs-app-final.zip';

    async function loginIfRequired(page: Page) {
        if (page.url().includes('login')) {
            console.log('Detecting login page, performing fallback login...');
            await page.getByRole('textbox').first().fill('Testing');
            await page.getByRole('textbox').nth(1).fill('Test@123');
            await page.getByRole('button', { name: /login/i }).click();
            await page.waitForURL(/.*\/projects.*/, { timeout: 60000 });
            await page.waitForLoadState('networkidle');
        }
    }

    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');

        await page.waitForLoadState('domcontentloaded');
        await loginIfRequired(page);

        await page.waitForLoadState('networkidle');

        console.log('Selecting project and environment...');
        const projectCard = page.getByTestId('project-card').first();
        await expect(projectCard).toBeVisible({ timeout: 60000 });
        await projectCard.click();

        const envCard = page.getByTestId('environment-card').first();
        await expect(envCard).toBeVisible({ timeout: 60000 });
        await envCard.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled({ timeout: 60000 });
        await proceedBtn.click();

        console.log('Navigating to applications page...');
        await page.waitForURL(/.*\/applications$/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');

        const newAppBtn = page.getByTestId('btn-new-application');
        await expect(newAppBtn).toBeVisible({ timeout: 60000 });
        await newAppBtn.click();

        await page.waitForURL(/.*\/create-application$/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');
    });

    test('Create Deployment with Default Prefilled Values', async ({ page }) => {
        console.log('Starting ZIP upload flow from URL:', ZIP_FILE_URL);

        await page.getByTestId('select-type').click();
        await page.getByTestId('option-type-zip').click();

        const response = await page.request.get(ZIP_FILE_URL);
        const buffer = await response.body();

        const fileInput = page.locator('input[formcontrolname="zipfileInput"]');
        await fileInput.setInputFiles({
            name: 'vuejs-app-final.zip',
            mimeType: 'application/zip',
            buffer: buffer
        });

        const submitFileBtn = page.getByTestId('btn-zip-submit');
        await expect(submitFileBtn).toBeEnabled({ timeout: 60000 });
        await submitFileBtn.click();

        console.log('Filling basic details...');
        const nameInput = page.locator('input[formcontrolname="name"]');
        await expect(nameInput).toBeVisible({ timeout: 60000 });
        const appName = 'vuejs-app-e2e-' + Date.now();
        await nameInput.fill(appName);

        const portInput = page.locator('input[formcontrolname="port"]');
        await portInput.fill('8080');

        const instanceSelect = page.locator('select[formcontrolname="instanceType"]');
        await expect(instanceSelect).toBeVisible();
        await instanceSelect.selectOption({ label: 'micro.m' });

        console.log('Navigating through checkout steps...');
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();

        console.log('Submitting deployment...');
        const submitBtn = page.getByTestId('btn-next');
        await expect(submitBtn).toHaveText(/Submit/i, { timeout: 60000 });
        await submitBtn.click();

        console.log('Verifying successful creation...');
        await page.waitForURL(/.*\/applications$/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');

        const table = page.getByTestId('ag-grid-table');
        await expect(table).toBeVisible({ timeout: 60000 });
    });
});

