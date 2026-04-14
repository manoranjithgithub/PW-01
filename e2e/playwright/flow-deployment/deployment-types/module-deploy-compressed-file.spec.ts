import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Compressed File (ZIP/TAR) Deployment Flow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');
        await page.getByTestId('project-card').first().click();
        await page.getByTestId('environment-card').first().click();
        await page.getByTestId('proceed-btn').click();
        await page.waitForURL('**/applications');
        await page.getByRole('button', { name: /create.*deployment/i }).click();
        await page.waitForURL('**/create-deployments');
    });

    test.describe('Positive Scenarios', () => {

        test('Should allow uploading a valid ZIP file and navigating to general settings', async ({ page }) => {
            await page.getByTestId('select-type').click();
            await page.getByTestId('option-type-zip').click();

            const fileInput = page.locator('input[data-testid="input-zip-file"]');
            
            const dummyPath = path.resolve('dummy-app.zip');
            fs.writeFileSync(dummyPath, 'content');

            await fileInput.setInputFiles(dummyPath);

            const submitFileBtn = page.getByTestId('btn-zip-submit');
            await expect(submitFileBtn).toBeEnabled();
            await submitFileBtn.click();

            const nameInput = page.locator('input[formcontrolname="name"]');
            await expect(nameInput).toHaveValue('dummy-app');
            
            if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
        });
    });

    test.describe('Negative Scenarios', () => {

        test('Should block submission in modal if no file is selected', async ({ page }) => {
            await page.getByTestId('select-type').click();
            await page.getByTestId('option-type-zip').click();

            const submitBtn = page.getByTestId('btn-zip-submit');
            await expect(submitBtn).toBeDisabled();
        });

        test('Should show error when an invalid file format is uploaded', async ({ page }) => {
            await page.getByTestId('select-type').click();
            await page.getByTestId('option-type-zip').click();

            const fileInput = page.locator('input[data-testid="input-zip-file"]');
            const invalidFilePath = path.resolve('invalid.txt');
            fs.writeFileSync(invalidFilePath, 'content');

            await fileInput.setInputFiles(invalidFilePath);

            const errorMsg = page.locator('.text-danger').filter({ hasText: 'Invalid file type' });
            await expect(errorMsg).toBeVisible();

            if (fs.existsSync(invalidFilePath)) fs.unlinkSync(invalidFilePath);
        });

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
