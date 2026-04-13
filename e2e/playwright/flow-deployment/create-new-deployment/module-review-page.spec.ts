import { test, expect } from '@playwright/test';

test.describe('Deployment Review Page Flow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');
        await page.getByTestId('project-card').first().click();
        await page.getByTestId('environment-card').first().click();
        await page.getByTestId('proceed-btn').click();
        await page.waitForURL('**/applications');
        await page.getByRole('button', { name: /create.*deployment/i }).click();
        await page.waitForURL('**/create-deployments');

        await page.getByTestId('select-type').click();
        await page.getByTestId('option-type-zip').click();
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.locator('input[data-testid="input-zip-file"]').click(),
        ]);
        await fileChooser.setFiles({
            name: 'review-test.zip',
            mimeType: 'application/zip',
            buffer: Buffer.from('test content'),
        });
        await page.getByTestId('btn-zip-submit').click();

        await page.locator('input[formcontrolname="name"]').fill('review-test-app');


        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();
        await expect(page.getByText('Review Your Application', { exact: false })).toBeVisible();
    });

    test.describe('Positive Scenarios', () => {

        test('Should display all deployment modules in a readable summary', async ({ page }) => {
            await expect(page.locator('app-review-screen')).toBeVisible();
            await expect(page.getByText('Basic Details')).toBeVisible();
            await expect(page.getByText('Environment Variables')).toBeVisible();
            await expect(page.getByText('Secrets')).toBeVisible();
            await expect(page.getByText('Config as file')).toBeVisible();

            const submitBtn = page.getByTestId('btn-next');
            await expect(submitBtn).toHaveText(/Submit/i);
            await expect(submitBtn).toBeEnabled();
        });

        test('Should allow editing basic details and returning to review page', async ({ page }) => {

            const editBasicBtn = page.locator('.review-card').filter({ hasText: 'Basic Details' }).locator('i.bi-pencil-square');
            await editBasicBtn.click();

            await expect(page.locator('input[formcontrolname="name"]')).toBeVisible();
            await page.locator('input[formcontrolname="name"]').fill('updated-review-app');

            await page.getByTestId('btn-next').click();

            await expect(page.getByText('Review Your Application')).toBeVisible();
            await expect(page.getByText('updated-review-app')).toBeVisible();
        });

        test('Should allow editing environment variables and returning to review page', async ({ page }) => {

            const editEnvBtn = page.locator('.review-card').filter({ hasText: 'Environment Variables' }).locator('i.bi-pencil-square');
            await editEnvBtn.click();

            await expect(page.locator('app-environment-variables')).toBeVisible();

            await page.getByTestId('btn-next').click();
            await expect(page.getByText('Review Your Application')).toBeVisible();
        });
    });

    test.describe('Negative Scenarios', () => {

        test('Should not apply changes if user navigates away without saving', async ({ page }) => {

            const editBasicBtn = page.locator('.review-card').filter({ hasText: 'Basic Details' }).locator('i.bi-pencil-square');
            await editBasicBtn.click();

            await page.locator('input[formcontrolname="name"]').fill('unsaved-change');

            await page.locator('.step-label-review').click();

            await expect(page.getByText('review-test-app')).toBeVisible();
            await expect(page.getByText('unsaved-change')).not.toBeVisible();
        });

        test('Should disable Submit button during deployment submission', async ({ page }) => {

            const submitBtn = page.getByTestId('btn-next');

            await submitBtn.click();
            await expect(submitBtn).toBeDisabled();
        });
    });
});
