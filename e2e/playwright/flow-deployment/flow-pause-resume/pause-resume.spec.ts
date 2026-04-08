import { test, expect, Page } from '@playwright/test';

test.describe('12.1   Positive Pause/Resume Application', () => {

    test.use({
        baseURL: 'https://app.dev.nimbuz.tech/'
    });

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);

        await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });

        const loginBtn = page.getByRole('button', { name: /login/i });
        if (await loginBtn.count() > 0) {
            await page.getByRole('textbox').first().fill('Testing');
            await page.getByRole('textbox').nth(1).fill('Test@123');
            await loginBtn.click();
        }

        await page.waitForURL('**/projects', { timeout: 15000 });

        const firstProject = page.getByTestId('project-card').first();
        await expect(firstProject).toBeVisible({ timeout: 15000 });
        await firstProject.click();

        const firstEnv = page.getByTestId('environment-card').first();
        await expect(firstEnv).toBeVisible({ timeout: 15000 });
        await firstEnv.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled();
        await proceedBtn.click();

        await page.goto('/deployment');

        await page.waitForURL('**/deployment*', { timeout: 15000 });

        const table = page.getByTestId('ag-grid-table');
        await expect(table).toBeVisible({ timeout: 15000 });
    });

    test('12.1.1 – Pause Application Successfully', async ({ page }) => {
        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const pauseOption = page.getByTestId('deployment-action-pause');

        await expect(pauseOption).toBeVisible({ timeout: 5000 });
        await pauseOption.click();

        const modal = page.getByTestId('deploy-confirmation-modal').first();
        await expect(modal).toBeVisible();


        const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');
        await expect(confirmBtn).toBeEnabled();

        await confirmBtn.click();

        await expect(page.getByText('Application paused successfully').first()).toBeVisible({ timeout: 15000 });
    });

    test('12.1.2 – Resume Application Successfully', async ({ page }) => {
        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const resumeOption = page.getByTestId('deployment-action-resume');
        await expect(resumeOption).toBeVisible({ timeout: 5000 });
        await resumeOption.click();

        const modal = page.getByTestId('deploy-confirmation-modal').first();
        await expect(modal).toBeVisible();


        const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');
        await expect(confirmBtn).toBeEnabled();

        await confirmBtn.click();

        await expect(page.getByText('Application resumed successfully').first()).toBeVisible({ timeout: 15000 });
    });
});

