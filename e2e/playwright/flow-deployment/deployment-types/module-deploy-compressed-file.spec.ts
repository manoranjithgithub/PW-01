import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Compressed File (ZIP/TAR) Deployment Flow', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForLoadState('networkidle');
        if (page.url().includes('login')) {
            await page.locator('input[formcontrolname="username"]').fill('Testing');
            await page.locator('input[formcontrolname="password"]').fill('Test@123');
            await page.getByTestId('btn-login').click();
            await page.waitForURL(/.*\/projects.*/, { timeout: 60000 });
            await page.waitForLoadState('networkidle');
        }

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

    test.describe('Positive Scenarios', () => {

        async function createCompletedDeployment(page: Page, appName: string, format: string) {
            await page.getByTestId('select-type').click();
            await page.getByTestId('option-type-zip').click();

            const fileInput = page.getByTestId('input-zip-file');
            const fileName = `shared-deploy-file.${format}`;
            const dummyPath = path.resolve(fileName);
            if (!fs.existsSync(dummyPath)) {
                fs.writeFileSync(dummyPath, `dummy ${format} content placeholder`);
            }

            await fileInput.setInputFiles(dummyPath);

            const submitFileBtn = page.getByTestId('btn-zip-submit');
            await expect(submitFileBtn).toBeEnabled();
            await submitFileBtn.click();

            const nameInput = page.locator('input[formcontrolname="name"]');
            await expect(nameInput).toBeVisible({ timeout: 60000 });
            await nameInput.fill(appName);

            const portInput = page.locator('input[formcontrolname="port"]');
            if (await portInput.isVisible()) {
                await portInput.fill('8080');
            }

            await page.getByTestId('btn-next').click();

            // Environment Variables
            const envKey = page.locator('input[formcontrolname="key"]').first();
            await envKey.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
            if (await envKey.isVisible()) {
                await envKey.fill('ENV_VAR_1');
                await page.locator('input[formcontrolname="value"]').first().fill('test-value');
            }
            await page.getByTestId('btn-next').click();

            // Secrets
            const newSecretBtn = page.getByTestId('btn-secret-new');
            await newSecretBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
            if (await newSecretBtn.isVisible()) {
                await newSecretBtn.click();
                await page.getByTestId('input-secret-name').first().fill('SECRET_1');
                await page.getByTestId('input-secret-value').first().fill('SECRET_VALUE');
                await page.getByTestId('btn-secret-add-to-list').click();
            }
            await page.getByTestId('btn-next').click();

            // Config as file
            await page.getByTestId('btn-next').click();

            // Review
            await expect(page.getByTestId('review-details-title')).toBeVisible({ timeout: 15000 });
            await page.getByTestId('btn-next').click();

            if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
        }

        test('2.1.1 - Deployment via ZIP File', async ({ page }) => {
            const appName = `zip-app-${Date.now()}`;
            await createCompletedDeployment(page, appName, 'zip');
        });

        test('2.1.2 - Deployment via TAR File', async ({ page }) => {
            const appName = `tar-app-${Date.now()}`;
            await createCompletedDeployment(page, appName, 'tar');
        });

        test('2.1.3 - Multiple Deployments with Same File Name (Same Project)', async ({ page }) => {
            const appName1 = `sameproj1-${Date.now()}`;
            const appName2 = `sameproj2-${Date.now()}`;

            // 1st Deployment
            await createCompletedDeployment(page, appName1, 'zip');

            // 2nd Deployment
            await page.goto('/projects', { waitUntil: 'domcontentloaded' });
            await page.getByTestId('project-card').first().click();
            await page.getByTestId('environment-card').first().click();
            await page.getByTestId('proceed-btn').click();
            await page.getByTestId('btn-new-application').click();

            await createCompletedDeployment(page, appName2, 'zip');
        });

        test('2.1.4 - Multiple Deployments with Same File Name (Different Projects)', async ({ page }) => {
            const appName1 = `diffproj1-${Date.now()}`;
            const appName2 = `diffproj2-${Date.now()}`;

            // 1st Deployment
            await createCompletedDeployment(page, appName1, 'zip');

            // 2nd Deployment
            await page.goto('/projects', { waitUntil: 'domcontentloaded' });

            const projectCards = page.getByTestId('project-card');
            if (await projectCards.count() > 1) {
                await projectCards.nth(1).click();
                await page.getByTestId('environment-card').first().click();
            } else {
                await projectCards.first().click();
                const envCards = page.getByTestId('environment-card');
                if (await envCards.count() > 1) {
                    await envCards.nth(1).click();
                } else {
                    await envCards.first().click();
                }
            }

            await page.getByTestId('proceed-btn').click();
            await page.getByTestId('btn-new-application').click();

            await createCompletedDeployment(page, appName2, 'zip');
        });
    });

    test.describe('Negative Scenarios', () => {

        // test('Should block submission in modal if no file is selected', async ({ page }) => {
        //     await page.getByTestId('select-type').click();
        //     await page.getByTestId('option-type-zip').click();

        //     const submitBtn = page.getByTestId('btn-zip-submit');
        //     await expect(submitBtn).toBeDisabled();
        // });

        // test('Should show error when an invalid file format is uploaded', async ({ page }) => {
        //     await page.getByTestId('select-type').click();
        //     await page.getByTestId('option-type-zip').click();

        //     const fileInput = page.locator('input[data-testid="input-zip-file"]');
        //     const invalidFilePath = path.resolve('invalid.txt');
        //     fs.writeFileSync(invalidFilePath, 'content');

        //     await fileInput.setInputFiles(invalidFilePath);

        //     const errorMsg = page.locator('.text-danger').filter({ hasText: 'Invalid file type' });
        //     await expect(errorMsg).toBeVisible();

        //     if (fs.existsSync(invalidFilePath)) fs.unlinkSync(invalidFilePath);
        // });

        test('Should show error if the application name extracted from ZIP already exists', async ({ page }) => {
            await page.getByTestId('select-type').click();
            await page.getByTestId('option-type-zip').click();

            const existingPath = path.resolve('existing-app-name.zip');
            fs.writeFileSync(existingPath, 'content');

            await page.locator('input[data-testid="input-zip-file"]').setInputFiles(existingPath);
            await page.getByTestId('btn-zip-submit').click();

            const nameInput = page.locator('input[formcontrolname="name"]');
            await nameInput.blur();

            await expect(page.locator('.text-danger').filter({ hasText: 'Name is already taken' })).toBeVisible();

            if (fs.existsSync(existingPath)) fs.unlinkSync(existingPath);
        });

        test('Should show error if file exceeds the 500MB limit', async ({ page }) => {
            await page.getByTestId('select-type').click();
            await page.getByTestId('option-type-zip').click();

            await page.evaluate(() => {
                const dt = new DataTransfer();
                const file = new File([''], 'huge.zip', { type: 'application/zip' });
                Object.defineProperty(file, 'size', { value: 600 * 1024 * 1024 });
                dt.items.add(file);
                (document.querySelector('input[data-testid="input-zip-file"]') as HTMLInputElement).files = dt.files;
                (document.querySelector('input[data-testid="input-zip-file"]') as HTMLInputElement).dispatchEvent(new Event('change', { bubbles: true }));
            });

            const errorMsg = page.locator('.text-danger').filter({ hasText: 'File size exceeds' });
            await expect(errorMsg).toBeVisible();
        });
    });
});
