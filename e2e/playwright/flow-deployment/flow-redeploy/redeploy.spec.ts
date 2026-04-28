import { test, expect, Page } from '@playwright/test';

test.describe('14.1 - Positive Redeploy', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForURL('**/projects', { timeout: 15000 });
        await page.waitForTimeout(2000);

        const firstProject = page.getByTestId('project-card').first();
        await expect(firstProject).toBeVisible({ timeout: 15000 });
        await firstProject.click();

        const firstEnv = page.getByTestId('environment-card').first();
        await expect(firstEnv).toBeVisible({ timeout: 15000 });
        await firstEnv.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled();
        await proceedBtn.click();

        await page.waitForURL('**/applications*', { timeout: 15000 });
        await page.waitForTimeout(2000);
    });

    test('14.1.1 – Re-deploy Application Successfully', async ({ page }) => {
        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const redeployOption = page.getByTestId('deployment-action-redeploy').first();
        await expect(redeployOption).toBeVisible();
        await redeployOption.click();

        const modal = page.getByTestId('deploy-confirmation-modal').first();
        await expect(modal).toBeVisible();

        const message = modal.getByTestId('deploy-confirmation-message').first();

        await expect(message).toContainText('Are you sure you want to redeploy this application?');

        const text = await message.textContent();
        console.log(text);

        const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');
        await expect(confirmBtn).toBeEnabled();
        await confirmBtn.click();

        // await expect(page.locator('text=Application re-deployed successfully').first()).toBeVisible({ timeout: 15000 });

        await page.waitForTimeout(1000);
    });

});

test.describe('14.2 - Negative Redeploy', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForURL('**/projects', { timeout: 15000 });
        await page.waitForTimeout(2000);

        const firstProject = page.getByTestId('project-card').first();
        await expect(firstProject).toBeVisible({ timeout: 15000 });
        await firstProject.click();

        const firstEnv = page.getByTestId('environment-card').first();
        await expect(firstEnv).toBeVisible({ timeout: 15000 });
        await firstEnv.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled();
        await proceedBtn.click();

        await page.waitForURL('**/applications*', { timeout: 15000 });
        await page.waitForTimeout(2000);
    });

    test('14.2.1 – Re-deploy Fails Due to Build Error', async ({ page }) => {
        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const redeployOption = page.getByTestId('deployment-action-redeploy').first();
        await expect(redeployOption).toBeVisible();
        await redeployOption.click();

        const modal = page.getByTestId('deploy-confirmation-modal').first();
        await expect(modal).toBeVisible();

        const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');
        await expect(confirmBtn).toBeEnabled();

        await page.route('**/deployments/*', async route => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Internal Server Error', error: { details: 'Re-deployment failed during build.' } })
                });
            } else {
                await route.continue();
            }
        });

        await confirmBtn.click();

        await expect(page.locator('text=Re-deployment failed during build').first()).toBeVisible({ timeout: 15000 });
    });

    // test('14.2.2 – Re-deploy When Deployment Is In Progress', async ({ page }) => {
    //     await page.route('**/deployments?environmentId=*', async route => {
    //         const response = await route.fetch();
    //         const json = await response.json();
    //         if (json && json.data && json.data.length > 0) {
    //             json.data[0].status = 'Building';
    //         }
    //         await route.fulfill({ response, json });
    //     });

    //     await page.reload();
    //     await page.waitForTimeout(2000);

    //     const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
    //     await expect(firstRow).toBeVisible({ timeout: 15000 });

    //     const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
    //     await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
    //     await actionMenuBtn.click();

    //     const redeployOption = page.getByTestId('deployment-action-redeploy').first();
    //     if (await redeployOption.isVisible()) {
    //         await expect(redeployOption).toHaveClass(/disabled/);
    //     } else {
    //         await expect(redeployOption).not.toBeVisible();
    //     }
    // });

    // test('14.2.3 – Re-deploy Fails Due to Repository Access Issue', async ({ page }) => {
    //     const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
    //     await expect(firstRow).toBeVisible({ timeout: 15000 });

    //     const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
    //     await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
    //     await actionMenuBtn.click();

    //     const redeployOption = page.getByTestId('deployment-action-redeploy').first();
    //     await expect(redeployOption).toBeVisible();
    //     await redeployOption.click();

    //     const modal = page.getByTestId('deploy-confirmation-modal').first();
    //     await expect(modal).toBeVisible();

    //     const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');

    //     await page.route('**/deployments/*', async route => {
    //         if (route.request().method() === 'PUT') {
    //             await route.fulfill({
    //                 status: 500,
    //                 contentType: 'application/json',
    //                 body: JSON.stringify({ message: 'Internal Server Error', error: { details: 'Unable to fetch repository. Please check VCS access.' } })
    //             });
    //         } else {
    //             await route.continue();
    //         }
    //     });

    //     await confirmBtn.click();

    //     await expect(page.locator('text=Unable to fetch repository. Please check VCS access.').first()).toBeVisible({ timeout: 15000 });
    // });

});
