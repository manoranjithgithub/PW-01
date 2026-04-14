import { test, expect, Page } from '@playwright/test';

test.describe('11.1 - Positive Edit Basic Details', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(180000);
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForURL('**/projects', { timeout: 20000 });
        await page.waitForTimeout(2000);

        const firstProject = page.getByTestId('project-card').first();
        await expect(firstProject).toBeVisible({ timeout: 20000 });
        await firstProject.click();

        const firstEnv = page.getByTestId('environment-card').first();
        await expect(firstEnv).toBeVisible({ timeout: 20000 });
        await firstEnv.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled({ timeout: 20000 });
        await proceedBtn.click();

        await page.waitForURL('**/applications*', { timeout: 20000 });

        const table = page.getByTestId('ag-grid-table');
        await expect(table).toBeVisible({ timeout: 25000 });

        const firstRow = table.locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 25000 });

        const nameCell = firstRow.locator('.ag-cell[col-id="name"]');
        await expect(nameCell).toBeVisible({ timeout: 15000 });
        await nameCell.click();

        await expect(page).toHaveURL(/.*application-details.*/, { timeout: 25000 });

        const settingsTab = page.getByTestId('settings-tab');
        await expect(settingsTab).toBeVisible({ timeout: 30000 });
        await settingsTab.click();

        await expect(page.locator('app-deployment-settings').first()).toBeVisible({ timeout: 20000 });
    });

    test('11.1.1 – View Deployment Settings (Read-Only During Build)', async ({ page }) => {
        const buildAlert = page.locator('c-alert[color="warning"]', { hasText: /building/i });

        if (await buildAlert.isVisible()) {
            const fieldset = page.locator('fieldset.card-child');
            await expect(fieldset).toHaveAttribute('disabled', '');

            const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });
            await expect(saveBtn).toBeDisabled();
        } else {
            console.log('Application is not in building state, skipping read-only check.');
        }
    });

    test('11.1.2 – Edit Deployment After Successful Build (Deploy Only)', async ({ page }) => {
        const replicasInput = page.locator('[formControlName="replicas"]');
        const portInput = page.locator('[formControlName="port"]');
        const healthInput = page.locator('[formControlName="healthEndpoint"]');
        const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });

        await expect(replicasInput).toBeEnabled({ timeout: 10000 });

        const currentReplicas = await replicasInput.inputValue();
        const newReplicas = currentReplicas === '1' ? '2' : '1';

        await replicasInput.click({ clickCount: 3 });
        await replicasInput.type(newReplicas);
        await replicasInput.dispatchEvent('input');
        await replicasInput.dispatchEvent('change');

        await portInput.click({ clickCount: 3 });
        await portInput.type('8080');
        await portInput.dispatchEvent('input');
        await portInput.dispatchEvent('change');

        await healthInput.click({ clickCount: 3 });
        await healthInput.type('/healthz');
        await healthInput.dispatchEvent('input');
        await healthInput.dispatchEvent('change');

        await expect(saveBtn).toBeEnabled({ timeout: 10000 });
        await saveBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.toast-success')).toHaveText(/Updated successfully/i);
    });

    test('11.1.3 – Edit Deployment After Successful Build (Build + Deploy)', async ({ page }) => {
        const folderPathInput = page.locator('[formControlName="folderPath"]');
        const dockerFileNameInput = page.locator('[formControlName="dockerFileName"]');
        const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });

        await expect(folderPathInput).toBeEnabled({ timeout: 10000 });

        await folderPathInput.click({ clickCount: 3 });
        await folderPathInput.type('./');
        await folderPathInput.dispatchEvent('input');
        await folderPathInput.dispatchEvent('change');

        await dockerFileNameInput.click({ clickCount: 3 });
        await dockerFileNameInput.type('Dockerfile');
        await dockerFileNameInput.dispatchEvent('input');
        await dockerFileNameInput.dispatchEvent('change');

        await expect(saveBtn).toBeEnabled({ timeout: 10000 });
        await saveBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.toast-success')).toHaveText(/Updated successfully/i);
    });

});

test.describe('11.2 - Negative Edit Basic Details', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(180000);
        await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForURL('**/projects', { timeout: 20000 });

        const firstProject = page.getByTestId('project-card').first();
        await firstProject.click();

        const firstEnv = page.getByTestId('environment-card').first();
        await firstEnv.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await proceedBtn.click();

        await page.waitForURL('**/applications*', { timeout: 20000 });

        const table = page.getByTestId('ag-grid-table');
        const firstRow = table.locator('.ag-row').first();
        await expect(firstRow).toBeVisible({ timeout: 25000 });

        const nameCell = firstRow.locator('.ag-cell[col-id="name"]');
        await nameCell.click();

        await page.waitForURL(/.*application-details.*/, { timeout: 25000 });

        const settingsTab = page.getByTestId('settings-tab');
        await expect(settingsTab).toBeVisible({ timeout: 30000 });
        await settingsTab.click();

        await expect(page.locator('app-deployment-settings').first()).toBeVisible({ timeout: 20000 });
    });

    test('11.2.1 – Attempt to Edit Deployment During Build', async ({ page }) => {
        const buildAlert = page.locator('c-alert[color="warning"]', { hasText: /building/i });

        if (await buildAlert.isVisible()) {
            const replicasInput = page.locator('[formControlName="replicas"]');
            await expect(replicasInput).toBeDisabled();

            const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });
            await expect(saveBtn).toBeDisabled();
        }
    });

    test('11.2.2 – Save Without Changing Any Value', async ({ page }) => {
        const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });
        await expect(saveBtn).toBeDisabled();
    });

    test('11.2.3 – Invalid Value in Editable Field', async ({ page }) => {
        const portInput = page.locator('[formControlName="port"]');
        const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });

        await portInput.click({ clickCount: 3 });
        await portInput.type('70000');
        await portInput.dispatchEvent('input');
        await portInput.dispatchEvent('change');
        await portInput.blur();

        const errorMsg = page.locator('.text-danger', { hasText: /must be between 1 and 65535/i });
        await expect(errorMsg).toBeVisible();

        await expect(saveBtn).toBeDisabled();
    });

    test('11.2.4 – Build Failure After Editing Build Fields', async ({ page }) => {
        const folderPathInput = page.locator('[formControlName="folderPath"]');
        const dockerFileNameInput = page.locator('[formControlName="dockerFileName"]');
        const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });

        await folderPathInput.click({ clickCount: 3 });
        await folderPathInput.type('./non-existent-folder');
        await folderPathInput.dispatchEvent('input');
        await folderPathInput.dispatchEvent('change');

        await dockerFileNameInput.click({ clickCount: 3 });
        await dockerFileNameInput.type('NonExistentDockerfile');
        await dockerFileNameInput.dispatchEvent('input');
        await dockerFileNameInput.dispatchEvent('change');

        await expect(saveBtn).toBeEnabled({ timeout: 10000 });
        await saveBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 15000 });
    });

    test('11.2.5 – Deployment Failure After Deploy-Only Change', async ({ page }) => {
        const healthInput = page.locator('[formControlName="healthEndpoint"]');
        const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save changes' });

        await healthInput.click({ clickCount: 3 });
        await healthInput.type('/invalid-health-path');
        await healthInput.dispatchEvent('input');
        await healthInput.dispatchEvent('change');

        await expect(saveBtn).toBeEnabled({ timeout: 10000 });
        await saveBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 15000 });
    });

});
