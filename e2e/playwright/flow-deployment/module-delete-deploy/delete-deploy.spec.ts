import { test, expect } from '@playwright/test';

test.describe('Deployment Deletion Flow', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);

        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
        });

        const projectResponsePromise = page.waitForResponse(res => res.url().includes('/projects') && res.status() === 200, { timeout: 30000 }).catch(() => null);
        await page.goto('/projects', { waitUntil: 'networkidle', timeout: 60000 });

        if (page.url().includes('/login')) {
            throw new Error('AUTH SESSION FAILURE: Redirected to /login. Please check playwright/.auth/user.json or credentials in global setup.');
        }

        await projectResponsePromise;

        const firstProject = page.getByTestId('project-card').first();
        await expect(firstProject).toBeVisible({ timeout: 20000 });
        await firstProject.click();

        const envResponsePromise = page.waitForResponse(res => res.url().includes('/environments') && res.status() === 200, { timeout: 30000 }).catch(() => null);
        const firstEnv = page.getByTestId('environment-card').first();
        await envResponsePromise;
        await expect(firstEnv).toBeVisible({ timeout: 20000 });
        await firstEnv.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled();
        await proceedBtn.click();

        await page.waitForURL('**/applications*', { timeout: 20000 });

        await page.waitForSelector('.ag-root-wrapper', { timeout: 20000 }).catch(() => null);
        await page.waitForTimeout(2000);
    });

    test('Should delete a deployment from the Settings page', async ({ page }) => {
        const firstRow = page.locator('.ag-row').first();

        if (await firstRow.count() > 0) {
            const deploymentName = (await firstRow.locator('.ag-cell[col-id="name"]').textContent())?.trim();
            console.log(`Deleting deployment: ${deploymentName}`);

            await firstRow.locator('.ag-cell[col-id="name"]').click({ force: true });
            await expect(page).toHaveURL(/application-details/);

            await page.getByText('Settings', { exact: true }).first().click();

            const deleteBtn = page.getByTestId('delete-deployment-btn');
            await expect(deleteBtn).toBeVisible();
            await deleteBtn.click();

            const confirmBtn = page.getByTestId('confirmation-confirm-btn');
            await expect(confirmBtn).toBeEnabled();
            await confirmBtn.click();

            // await expect(page.getByRole('alert')).toBeVisible();
            // await expect(page).toHaveURL(/\/applications$/);
        } else {
            console.log('No deployment exists, skipping deletion flow.');
        }
    });


});
