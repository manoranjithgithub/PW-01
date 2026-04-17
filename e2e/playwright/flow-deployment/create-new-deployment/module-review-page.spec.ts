import { test, expect, Page } from '@playwright/test';

test.describe('Deployment Review Page Flow', () => {

    test.slow();

    async function loginIfRequired(page: Page) {
        await page.waitForLoadState('networkidle');

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
        await loginIfRequired(page);

        const projectCard = page.getByTestId('project-card').first();
        await expect(projectCard).toBeVisible({ timeout: 60000 });
        await projectCard.click();

        const envCard = page.getByTestId('environment-card').first();
        await expect(envCard).toBeVisible({ timeout: 60000 });
        await envCard.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled({ timeout: 60000 });
        await proceedBtn.click();

        await page.waitForURL(/.*\/applications$/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');

        const newAppBtn = page.getByTestId('btn-new-application');
        await expect(newAppBtn).toBeVisible({ timeout: 60000 });
        await newAppBtn.click();

        await page.waitForURL(/.*\/create-application$/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');

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

        const instanceSelect = page.getByTestId('select-instance-type');
        await expect(instanceSelect.locator('option')).not.toHaveCount(0, { timeout: 30000 });

        // General -> Environment variable -> Secrets -> Config as file -> Review
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();
        await page.getByTestId('btn-next').click();

        await expect(page.getByTestId('review-details-title')).toBeVisible({ timeout: 60000 });
    });

    test.describe('Positive Scenarios', () => {

        test('Should display all deployment modules in a readable summary', async ({ page }) => {
            const review = page.locator('app-review-screen');
            await expect(review).toBeVisible();
            await expect(review.getByText('Review details')).toBeVisible();
            await expect(review.getByText('General')).toBeVisible();
            await expect(review.getByText('Configuration')).toBeVisible();
            await expect(review.getByText('Environment variables')).toBeVisible();
            await expect(review.getByText('Secrets')).toBeVisible();
            await expect(review.getByText('Config as file')).toBeVisible();

            const submitBtn = page.getByTestId('btn-next');
            await expect(submitBtn).toHaveText(/Submit/i);
            await expect(submitBtn).toBeEnabled();
        });

        test('Should allow editing basic details and returning to review page', async ({ page }) => {

            const editGeneralBtn = page.locator('app-review-screen .edit-icon').first();
            await editGeneralBtn.click();

            await expect(page.locator('input[formcontrolname="name"]')).toBeVisible({ timeout: 10000 });
            await page.locator('input[formcontrolname="name"]').fill('updated-review-app');

            await page.getByTestId('btn-next').click();

            await expect(page.getByTestId('review-details-title')).toBeVisible({ timeout: 60000 });
            await expect(page.getByText('updated-review-app')).toBeVisible();
        });

        test('Should allow editing environment variables and returning to review page', async ({ page }) => {

            const editIcons = page.locator('app-review-screen .edit-icon');
            await editIcons.nth(2).click();

            await expect(page.locator('app-environment-variables')).toBeVisible({ timeout: 10000 });

            await page.getByTestId('btn-next').click();

            await expect(page.getByTestId('review-details-title')).toBeVisible({ timeout: 60000 });
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
