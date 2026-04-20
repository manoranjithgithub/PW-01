import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

test.describe('Create New Deployment - General Details Phase', () => {

    test.slow();

    const ZIP_FILE_PATH = path.resolve('e2e/playwright/flow-deployment/deploy-folder/vuejs-app-final.zip');

    async function loginIfRequired(page: Page) {
        if (page.url().includes('login')) {
            await page.locator('input[formcontrolname="username"]').fill('Testing');
            await page.locator('input[formcontrolname="password"]').fill('Test@123');
            await page.getByTestId('btn-login').click();
            await page.waitForURL(/.*\/projects.*/, { timeout: 60000 });
            await page.waitForLoadState('networkidle');
        }
    }

    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');
        await page.waitForLoadState('domcontentloaded');
        await loginIfRequired(page);
        await page.waitForLoadState('networkidle');

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
    });

    async function uploadZipMock(page: Page) {
        await page.getByTestId('select-type').click();
        await page.getByTestId('option-type-zip').click();

        const fileInput = page.getByTestId('input-zip-file');
        await fileInput.setInputFiles(ZIP_FILE_PATH);

        const submitFileBtn = page.getByTestId('btn-zip-submit');
        await expect(submitFileBtn).toBeEnabled({ timeout: 60000 });
        await submitFileBtn.click();

        const nameInput = page.locator('input[formcontrolname="name"]');
        await expect(nameInput).toHaveValue('vuejs-app-final', { timeout: 15000 });
    }

    test('3.1.1 - Create Deployment with Default Prefilled Values', async ({ page }) => {
        const zipFilePath = path.resolve('e2e/playwright/flow-deployment/deploy-folder/vuejs-app-final.zip');
        console.log('Starting ZIP upload flow for:', zipFilePath);

        await page.getByTestId('select-type').click();
        await page.getByTestId('option-type-zip').click();

        const fileInput = page.getByTestId('input-zip-file');
        await fileInput.setInputFiles(zipFilePath);

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

        await page.getByTestId('btn-next').click();

    });

    test('3.1.2 - Create Deployment With Edited Deployment Name', async ({ page }) => {
        await page.evaluate(() => { localStorage.setItem('availableDeployments', JSON.stringify([])); });

        await uploadZipMock(page);

        const nameInput = page.locator('input[formcontrolname="name"]');
        await nameInput.fill('user-service-prod');
        await nameInput.blur();

        const portInput = page.locator('input[formcontrolname="port"]');
        await portInput.fill('8080');

        await page.getByTestId('btn-next').click();

        // await expect(page.getByTestId('step-environment-variable')).toHaveClass(/active/, { timeout: 15000 });
    });

    test('3.1.3 - Create Deployment With Multiple Replicas', async ({ page }) => {
        await uploadZipMock(page);

        const nameInput = page.locator('input[formcontrolname="name"]');
        await nameInput.fill(`replica-test-app-${Date.now()}`);

        const replicasInput = page.locator('input[formcontrolname="replicas"]');
        await replicasInput.fill('3');

        const portInput = page.locator('input[formcontrolname="port"]');
        await portInput.fill('8080');

        await page.getByTestId('btn-next').click();
        //   await expect(page.getByTestId('step-environment-variable')).toHaveClass(/active/, { timeout: 15000 });
    });

    test('3.1.4 - Create Deployment With Different Instance Type', async ({ page }) => {
        await uploadZipMock(page);

        const nameInput = page.locator('input[formcontrolname="name"]');
        await nameInput.fill(`instance-test-app-${Date.now()}`);

        const portInput = page.locator('input[formcontrolname="port"]');
        await portInput.fill('8080');

        const instanceSelect = page.locator('select[formcontrolname="instanceType"]');
        await instanceSelect.selectOption({ index: 2 });

        await page.getByTestId('btn-next').click();

        //  await expect(page.getByTestId('step-environment-variable')).toHaveClass(/active/, { timeout: 15000 });
    });

    test('3.1.5 - Create Deployment with Optional Fields', async ({ page }) => {
        await uploadZipMock(page);

        const nameInput = page.locator('input[formcontrolname="name"]');
        await nameInput.fill(`optional-test-app-${Date.now()}`);

        const portInput = page.locator('input[formcontrolname="port"]');
        await portInput.fill('8080');

        await page.locator('input[formcontrolname="folderPath"]').fill('/users-service');
        await page.locator('input[formcontrolname="dockerFileName"]').fill('Dockerfile.dev');
        await page.locator('input[formcontrolname="healthEndpoint"]').fill('/health');
        await page.locator('input[formcontrolname="ephemeralStorage"]').fill('5');

        await page.getByTestId('btn-next').click();

        // await expect(page.getByTestId('step-environment-variable')).toHaveClass(/active/, { timeout: 15000 });
    });

    test.describe('Negative Validations', () => {
        test('3.2.1 – Empty Deployment Name', async ({ page }) => {
            await uploadZipMock(page);
            const nameInput = page.locator('input[formcontrolname="name"]');
            await nameInput.fill('');
            await nameInput.blur();

            await page.getByTestId('btn-next').click();
            await expect(page.getByTestId('error-name-required')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.2 – Invalid Deployment Name Format', async ({ page }) => {
            await uploadZipMock(page);
            const nameInput = page.locator('input[formcontrolname="name"]');
            await nameInput.fill('My_App!');
            await nameInput.blur();

            await page.getByTestId('btn-next').click();
            await expect(page.getByTestId('error-name-pattern')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.3 – Replicas Set to Zero', async ({ page }) => {
            await uploadZipMock(page);
            const replicasInput = page.locator('input[formcontrolname="replicas"]');
            await replicasInput.fill('0');
            await replicasInput.blur();

            await page.getByTestId('btn-next').click();
            await expect(page.getByTestId('error-replicas-min')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.4 – Negative Replicas Value', async ({ page }) => {
            await uploadZipMock(page);
            const replicasInput = page.locator('input[formcontrolname="replicas"]');
            await replicasInput.fill('-1');
            await replicasInput.blur();

            await page.getByTestId('btn-next').click();
            await expect(page.getByTestId('error-replicas-pattern')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.5 – Non-numeric Replicas Value', async ({ page }) => {
            await uploadZipMock(page);
            const replicasInput = page.locator('input[formcontrolname="replicas"]');
            await replicasInput.fill('abc');
            await replicasInput.blur();

            await page.getByTestId('btn-next').click();
            await expect(page.getByTestId('error-replicas-pattern')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.7 – Invalid Port Number', async ({ page }) => {
            await uploadZipMock(page);
            const portInput = page.locator('input[formcontrolname="port"]');

            await portInput.fill('70000');
            await portInput.blur();
            await page.getByTestId('btn-next').click();
            await expect(page.getByTestId('error-port-minmax')).toBeVisible({ timeout: 15000 });

            await portInput.fill('-1');
            await portInput.blur();
            await expect(page.getByTestId('error-port-pattern')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.8 – Invalid Health Endpoint Format', async ({ page }) => {
            await uploadZipMock(page);
            const healthInput = page.locator('input[formcontrolname="healthEndpoint"]');

            await healthInput.fill('health');
            await healthInput.blur();
            await expect(page.getByTestId('error-health-pattern')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.9 – Invalid Ephemeral Storage Value', async ({ page }) => {
            await uploadZipMock(page);
            const storageInput = page.locator('input[formcontrolname="ephemeralStorage"]');

            await storageInput.fill('abc');
            await storageInput.blur();
            await expect(page.getByTestId('error-ephemeral-pattern')).toBeVisible({ timeout: 15000 });
        });

        test('3.2.15 – Save & Continue Without Required Fields', async ({ page }) => {
            await page.getByTestId('btn-next').click();

            await expect(page.getByTestId('step-general')).toHaveClass(/active/, { timeout: 15000 });
            await expect(page.getByTestId('error-type-required')).toBeVisible({ timeout: 15000 });
        });
    });

});
