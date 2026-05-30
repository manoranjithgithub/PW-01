import { test, expect, Page } from '@playwright/test';

async function navigateToEnvironmentVariables(page: Page) {
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

    await page.goto('/applications/create-application', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');

    await page.getByTestId('select-type').click();
    await page.getByTestId('option-type-zip').click();
    const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator('input[data-testid="input-zip-file"]').click(),
    ]);
    await fileChooser.setFiles({
        name: 'env-test.zip',
        mimeType: 'application/zip',
        buffer: Buffer.from('test content'),
    });
    await page.getByTestId('btn-zip-submit').click();

    await page.locator('input[formcontrolname="name"]').fill('env-test-app-' + Date.now());

    const instanceSelect = page.getByTestId('select-instance-type');
    await expect(instanceSelect.locator('option')).not.toHaveCount(0, { timeout: 30000 });

    await page.getByTestId('btn-next').click();
    await expect(page.getByTestId('step-environment-variable')).toHaveClass(/active/);
}

test.describe('4.1 - Positive Create Environment variables', () => {

    test.beforeEach(async ({ page }) => {
        await navigateToEnvironmentVariables(page);
    });

    test('4.1.1 – Add Single or Multiple Environment Variables Using Key–Value Fields', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();
        await page.locator('input[formcontrolname="name"]').fill('NODE_ENV');
        await page.locator('input[formcontrolname="value"]').fill('production');
        await page.getByTestId('btn-env-add-row').click();

        await page.locator('input[formcontrolname="name"]').nth(1).fill('API_URL');
        await page.locator('input[formcontrolname="value"]').nth(1).fill('https://api.example.com');

        await page.getByTestId('btn-env-add-to-list').click();

        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'NODE_ENV' })).toBeVisible();
        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'API_URL' })).toBeVisible();

        await page.getByTestId('btn-next').click();
        await expect(page.getByTestId('step-secrets')).toHaveClass(/active/);
    });

    test('4.1.2 – Add Environment Variables Using Raw Editor (.env Format)', async ({ page }) => {
        await page.getByTestId('btn-env-raw-editor').click();
        await expect(page.getByTestId('raw-editor-textarea')).toBeVisible();

        const envContent = `NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com`;
        await page.getByTestId('raw-editor-textarea').fill(envContent);

        await page.getByTestId('raw-editor-update').click();

        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'NODE_ENV' })).toBeVisible();
        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'PORT' })).toBeVisible();
        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'API_URL' })).toBeVisible();

        await page.getByTestId('btn-next').click();
        await expect(page.getByTestId('step-secrets')).toHaveClass(/active/);
    });

    test('4.1.3 – Add Environment Variables Using JSON Format', async ({ page }) => {
        await page.getByTestId('btn-env-raw-editor').click();
        await expect(page.getByTestId('raw-editor-textarea')).toBeVisible();

        await page.getByTestId('raw-editor-tab-json').click();

        const jsonContent = `{
            "NODE_ENV": "production",
            "PORT": "3000",
            "API_URL": "https://api.example.com"
        }`;

        await page.getByTestId('raw-editor-textarea').fill(jsonContent);

        await page.getByTestId('raw-editor-update').click();

        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'NODE_ENV' })).toBeVisible();
        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'PORT' })).toBeVisible();
        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'API_URL' })).toBeVisible();

        await page.getByTestId('btn-next').click();
        await expect(page.getByTestId('step-secrets')).toHaveClass(/active/);
    });

    test('4.1.6 – Auto-Save Environment Variable on Continue Without Clicking Add Env to List', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();
        await page.locator('input[formcontrolname="name"]').fill('AUTO_SAVE_VAR');
        await page.locator('input[formcontrolname="value"]').fill('saved');

        await page.getByTestId('btn-next').click();

        await expect(page.getByTestId('step-secrets')).toHaveClass(/active/);

        await page.getByTestId('btn-previous').click();

        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'AUTO_SAVE_VAR' })).toBeVisible();
        await expect(page.getByTestId(/env-value-\d+/).filter({ hasText: 'saved' })).toBeVisible();
    });

});

test.describe('4.2 - Negative Create Environment variables', () => {

    test.beforeEach(async ({ page }) => {
        await navigateToEnvironmentVariables(page);
    });

    test('4.2.1 – Variable Name Empty', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();
        await page.locator('input[formcontrolname="value"]').fill('production');
        await page.getByTestId('btn-env-add-to-list').click();

        await expect(page.getByText('Variable name is required.')).toBeVisible();

        await expect(page.getByTestId(/env-value-\d+/)).toHaveCount(0);
    });

    test('4.2.2 – Variable Value Empty', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();
        await page.locator('input[formcontrolname="name"]').fill('NODE_ENV');
        await page.getByTestId('btn-env-add-to-list').click();

        await expect(page.getByText('Variable value is required.')).toBeVisible();

        await expect(page.getByTestId(/env-name-\d+/)).toHaveCount(0);
    });

    test('4.2.3 – Variable Name and Value Both Empty', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();
        await page.getByTestId('btn-env-add-to-list').click();

        await expect(page.getByText('Variable name is required.')).toBeVisible();
        await expect(page.getByText('Variable value is required.')).toBeVisible();
    });

    test('4.2.4 – Duplicate Variable Name', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();

        await page.locator('input[formcontrolname="name"]').fill('NODE_ENV');
        await page.locator('input[formcontrolname="value"]').fill('production');
        await page.getByTestId('btn-env-add-to-list').click();

        await page.getByTestId('btn-env-new').click();
        await page.locator('input[formcontrolname="name"]').fill('NODE_ENV');
        await page.locator('input[formcontrolname="value"]').fill('development');

        await expect(page.getByText('Variable name already exists.')).toBeVisible();

        await page.getByTestId('btn-env-add-to-list').click({ force: true });

        await expect(page.getByTestId(/env-name-\d+/).filter({ hasText: 'NODE_ENV' })).toHaveCount(1);
    });

    test('4.2.5 - Invalid Characters in Variable Name', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();
        await page.locator('input[formcontrolname="name"]').fill('VAR NAME!');
        await page.locator('input[formcontrolname="value"]').fill('production');
        await page.getByTestId('btn-env-add-to-list').click();

        await expect(page.getByText('Only letters (A-Z, a-z, 0-9) and special characters (_ ,.) are allowed.')).toBeVisible();
    });

    test('4.2.6 - Partial Entry in Multiple Rows', async ({ page }) => {
        await page.getByTestId('btn-env-new').click();
        await page.locator('input[formcontrolname="name"]').fill('VAR1');
        await page.locator('input[formcontrolname="value"]').fill('value1');

        await page.getByTestId('btn-env-add-row').click();
        await page.locator('input[formcontrolname="name"]').nth(1).fill('VAR2');

        await page.getByTestId('btn-env-add-to-list').click();

        await expect(page.getByText('Variable value is required.')).toBeVisible();

        await expect(page.getByTestId(/env-name-\d+/)).toHaveCount(0);
    });

    test('4.2.7 – Invalid Raw Editor Format (.env)', async ({ page }) => {
        await page.getByTestId('btn-env-raw-editor').click();

        const invalidEnv = 'NODE_ENV production\nPORT:3000';
        await page.getByTestId('raw-editor-textarea').fill(invalidEnv);

        await expect(page.getByText('Invalid environment variable format')).toBeVisible();
        await expect(page.getByTestId('raw-editor-update')).toBeDisabled();
    });

    test('4.2.8 – Invalid JSON Format', async ({ page }) => {
        await page.getByTestId('btn-env-raw-editor').click();
        await page.getByTestId('raw-editor-tab-json').click();

        const invalidJson = '{\n  "NODE_ENV": "production",\n  "PORT": 3000,\n';
        await page.getByTestId('raw-editor-textarea').fill(invalidJson);

        await expect(page.getByText('Invalid environment variable JSON format')).toBeVisible();
        await expect(page.getByTestId('raw-editor-update')).toBeDisabled();
    });

    test('4.2.9 – Proceed Without Saving Any Environment Variables', async ({ page }) => {
        await expect(page.getByTestId(/env-name-\d+/)).toHaveCount(0);

        await page.getByTestId('btn-next').click();

        await expect(page.getByTestId('step-secrets')).toHaveClass(/active/);
    });

    test('4.2.12 – Upload Invalid JSON Environment File', async ({ page }) => {
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.getByTestId('btn-env-upload').click(),
        ]);

        const invalidJson = '{\n  "NODE_ENV": "production",\n  "PORT": 3000,';
        await fileChooser.setFiles({
            name: 'invalid-env.json',
            mimeType: 'application/json',
            buffer: Buffer.from(invalidJson),
        });

        await expect(page.getByTestId('error-env-file-upload')).toHaveText('Invalid JSON format. Please upload a valid JSON file.');
        await expect(page.getByTestId(/env-name-\d+/)).toHaveCount(0);
    });

});
