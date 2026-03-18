import { test, expect, Page } from '@playwright/test';

test.describe('10.1 - Positive Pause/Resume Application', () => {

    test.use({
        baseURL: 'http://localhost:4200/'
    });

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForTimeout(3000);

        const loginBtn = page.getByRole('button', { name: /login/i });
        if (await loginBtn.count() > 0) {
            await page.getByRole('textbox').first().fill('Development');
            await page.getByRole('textbox').nth(1).fill('Test@123');
            await loginBtn.click();
        }

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

        await page.waitForTimeout(2000); // give the router a second to settle
        await page.goto('/deployment');

        await page.waitForURL('**/deployment*', { timeout: 15000 });
        await page.waitForTimeout(2000); // Give the SSE stream time to populate the grid
    });

    test('10.1.1 – Pause Application Successfully', async ({ page }) => {
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

        const message = modal.getByTestId('deploy-confirmation-message').first();
        await expect(message).toContainText(/pause this deployment/i);

        const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');
        await expect(confirmBtn).toBeEnabled();

        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/deployments/') && response.request().method() === 'PUT'
        );

        await confirmBtn.click();

        const response = await responsePromise;
        expect(response.ok()).toBeTruthy();
        const requestData = response.request().postDataJSON();
        expect(requestData.action).toBe('pause');

        await expect(page.getByText('Successfully initiated').first()).toBeVisible({ timeout: 15000 });

        await page.waitForTimeout(1000);
    });

    test('10.1.2 – Resume Application Successfully', async ({ page }) => {
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

        const message = modal.getByTestId('deploy-confirmation-message').first();
        await expect(message).toContainText(/resume this deployment/i);

        const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');
        await expect(confirmBtn).toBeEnabled();

        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/deployments/') && response.request().method() === 'PUT'
        );

        await confirmBtn.click();

        const response = await responsePromise;
        expect(response.ok()).toBeTruthy();
        const requestData = response.request().postDataJSON();
        expect(requestData.action).toBe('resume');

        await expect(page.getByText('Successfully initiated').first()).toBeVisible({ timeout: 15000 });

        await page.waitForTimeout(1000);
    });
});

test.describe('10.2 - Negative Pause/Resume', () => {

    test.use({
        baseURL: 'http://localhost:4200/'
    });

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForTimeout(3000);

        const loginBtn = page.getByRole('button', { name: /login/i });
        if (await loginBtn.count() > 0) {
            await page.getByRole('textbox').first().fill('Development');
            await page.getByRole('textbox').nth(1).fill('Test@123');
            await loginBtn.click();
        }

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

        await page.waitForTimeout(2000);
        await page.goto('/deployment');

        await page.waitForURL('**/deployment*', { timeout: 15000 });
        await page.waitForTimeout(2000);
    });

    test('10.2.1 – Pause Application When Already Paused', async ({ page }) => {
        await page.route('**/deployments?environmentId=*', async route => {
            const response = await route.fetch();
            const json = await response.json();
            if (json && json.data && json.data.length > 0) {
                json.data[0].status = 'Stopped';
            }
            await route.fulfill({ response, json });
        });

        await page.reload();
        await page.waitForTimeout(2000);

        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const pauseOption = page.getByTestId('deployment-action-pause');
        await expect(pauseOption).not.toBeVisible();
    });

    test('10.2.2 - Pause Request in Progress', async ({ page }) => {
        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const pauseOption = page.getByTestId('deployment-action-pause');
        if (await pauseOption.isVisible()) {
            await pauseOption.click();

            const modal = page.getByTestId('deploy-confirmation-modal').first();
            await expect(modal).toBeVisible();

            const confirmBtn = modal.getByTestId('deploy-confirmation-confirm-btn');

            await page.route('**/deployments/*', async route => {
                if (route.request().method() === 'PUT') {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await route.continue();
                } else {
                    await route.continue();
                }
            });

            await confirmBtn.click();

            const cellRenderer = actionMenuBtn.locator('..');
            await expect(cellRenderer.locator('.disabled')).toBeVisible();
        }
    });

    test('10.2.3 – Pause Application While Deployment Is in Progress', async ({ page }) => {
        await page.route('**/deployments?environmentId=*', async route => {
            const response = await route.fetch();
            const json = await response.json();
            if (json && json.data && json.data.length > 0) {
                json.data[0].status = 'Building';
            }
            await route.fulfill({ response, json });
        });

        await page.reload();
        await page.waitForTimeout(2000);

        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const pauseOption = page.getByTestId('deployment-action-pause');
        await expect(pauseOption).toHaveClass(/disabled/);
    });

    test('10.2.4 – Resume Application When Already Running', async ({ page }) => {
        await page.route('**/deployments?environmentId=*', async route => {
            const response = await route.fetch();
            const json = await response.json();
            if (json && json.data && json.data.length > 0) {
                json.data[0].status = 'Running';
            }
            await route.fulfill({ response, json });
        });

        await page.reload();
        await page.waitForTimeout(2000);

        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const resumeOption = page.getByTestId('deployment-action-resume');
        await expect(resumeOption).not.toBeVisible();
    });

    test('10.2.5 – Resume Application While Deployment Is in Progress', async ({ page }) => {
        await page.route('**/deployments?environmentId=*', async route => {
            const response = await route.fetch();
            const json = await response.json();
            if (json && json.data && json.data.length > 0) {
                json.data[0].status = 'Building';
            }
            await route.fulfill({ response, json });
        });

        await page.reload();
        await page.waitForTimeout(2000);

        const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });

        const actionMenuBtn = firstRow.getByTestId('deployment-action-dropdown-btn').first();
        await expect(actionMenuBtn).toBeVisible({ timeout: 15000 });
        await actionMenuBtn.click();

        const resumeOption = page.getByTestId('deployment-action-resume');
        await expect(resumeOption).toHaveClass(/disabled/);
    });

    test('10.2.6 – Resume Application Without Required Permissions', async ({ page }) => {
        test.skip(true, 'Skip: Requires distinct user auth mocked specifically for permissions testing.');
    });

    test('10.2.7 – Resume Application Failure Due to System Error', async ({ page }) => {
        await page.route('**/deployments?environmentId=*', async route => {
            const response = await route.fetch();
            const json = await response.json();
            if (json && json.data && json.data.length > 0) {
                json.data[0].status = 'Stopped';
            }
            await route.fulfill({ response, json });
        });

        await page.reload();
        await page.waitForTimeout(2000);

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

        await page.route('**/deployments/*', async route => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Internal Server Error', error: { details: 'Failed to resume application. Please try again later.' } })
                });
            } else {
                await route.continue();
            }
        });

        await confirmBtn.click();

        await expect(page.getByText('Error in Resume deployment').first()).toBeVisible({ timeout: 15000 });
    });
});
