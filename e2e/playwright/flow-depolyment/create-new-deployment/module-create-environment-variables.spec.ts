import { test, expect, Page } from '@playwright/test';


const ACCESS_TOKEN =
    'eyJhbGciOiJSUzI1NiIsImtpZCI6Im5pbWJ1ei1jZXJ0IiwidHlwIjoiSldUIn0' +
    '.eyJvd25lciI6Im5pbWJ1eiIsIm5hbWUiOiJEZXYiLCJjcmVhdGVkVGltZSI6IjIwMjUtMTItMzBUMTM6MDI6MjZaIiwidXBkYXRlZFRpbWUiOiIyMDI1LTEyLTMwVDEzOjA1OjQwWiIsImRlbGV0ZWRUaW1lIjoiIiwiaWQiOiJiODQ0ZmNkYS05ZWJkLTQwOTUtYmYxYy0yZWUwYThiNDA2YTAiLCJ0eXBlIjoiIiwicGFzc3dvcmQiOiIiLCJwYXNzd29yZFNhbHQiOiIiLCJwYXNzd29yZFR5cGUiOiJwbGFpbiIsImRpc3BsYXlOYW1lIjoiRGV2IiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIiLCJhdmF0YXIiOiIiLCJhdmF0YXJUeXBlIjoiIiwicGVybWFuZW50QXZhdGFyIjoiIiwiZW1haWwiOiJtYW5vcmFuaml0aC5wZEBnbWFpbC5jb20iLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwicGhvbmUiOiIiLCJjb3VudHJ5Q29kZSI6IiIsInJlZ2lvbiI6IiIsImxvY2F0aW9uIjoiIiwiYWRkcmVzcyI6W10sImFmZmlsaWF0aW9uIjoiIiwidGl0bGUiOiIiLCJpZENhcmRUeXBlIjoiIiwiaWRDYXJkIjoiIiwiaG9tZXBhZ2UiOiIiLCJiaW8iOiIiLCJsYW5ndWFnZSI6IiIsImdlbmRlciI6IiIsImJpcnRoZGF5IjoiIiwiZWR1Y2F0aW9uIjoiIiwic2NvcmUiOjAsImthcm1hIjowLCJyYW5raW5nIjo1LCJpc0RlZmF1bHRBdmF0YXIiOmZhbHNlLCJpc09ubGluZSI6ZmFsc2UsImlzQWRtaW4iOmZhbHNlLCJpc0ZvcmJpZGRlbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsInNpZ251cEFwcGxpY2F0aW9uIjoibmltYnV6IiwiaGFzaCI6IiIsInByZUhhc2giOiIiLCJhY2Nlc3NLZXkiOiIiLCJhY2Nlc3NTZWNyZXQiOiIiLCJnaXRodWIiOiIiLCJnb29nbGUiOiIiLCJxcSI6IiIsIndlY2hhdCI6IiIsImZhY2Vib29rIjoiIiwiZGluZ3RhbGsiOiIiLCJ3ZWlibyI6IiIsImdpdGVlIjoiIiwibGlua2VkaW4iOiIiLCJ3ZWNvbSI6IiIsImxhcmsiOiIiLCJnaXRsYWIiOiIiLCJjcmVhdGVkSXAiOiIiLCJsYXN0U2lnbmluVGltZSI6IiIsImxhc3RTaWduaW5JcCI6IiIsInByZWZlcnJlZE1mYVR5cGUiOiIiLCJyZWNvdmVyeUNvZGVzIjpudWxsLCJ0b3RwU2VjcmV0IjoiIiwibWZhUGhvbmVFbmFibGVkIjpmYWxzZSwibWZhRW1haWxFbmFibGVkIjpmYWxzZSwibGRhcCI6IiIsInByb3BlcnRpZXMiOnsiYnVzaW5lc3NOYW1lIjoibmltYnV6IiwiaXNWZXJpZmllZCI6InRydWUiLCJuaW1idXpBY2NvdW50SWQiOiJiNjliZjczYi05ZGIwLTQ1M2QtOTZlNS00MzMwYmY2YjNkYzYiLCJuaW1idXpVc2VySWQiOiI5OTg0ZDE3Zi0yNDllLTRkZjMtYTMxZC0wOWEyMzc4YTFlZDQiLCJ0eXBlIjoiaW5kaXZpZHVhbCJ9LCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwiZ3JvdXBzIjpbXSwibGFzdFNpZ25pbldyb25nVGltZSI6IiIsInNpZ25pbldyb25nVGltZXMiOjAsIm1hbmFnZWRBY2NvdW50cyI6bnVsbCwidG9rZW5UeXBlIjoiYWNjZXNzLXRva2VuIiwidGFnIjoiIiwiYXpwIjoibmltYnV6IiwiaXNzIjoiaHR0cHM6Ly9jYXNkb29yLmRldi5uaW1idXoudGVjaCIsInN1YiI6ImI4NDRmY2RhLTllYmQtNDA5NS1iZjFjLTJlZTBhOGI0MDZhMCIsImF1ZCI6WyJuaW1idXoiXSwiZXhwIjoxNzcxODI0NTQwLCJuYmYiOjE3NzEyMTk3NDAsImlhdCI6MTc3MTIxOTc0MCwianRpIjoiYWRtaW4vMmRhMjUyMmEtMjIxMS00NDVhLThmYTQtZmYyZjlkYTM4NjE3In0' +
    '.kP6-qFY2hPWC7E-o2HGUwScONBEW8z9ru91QZyB-9kur-36Xe_FzY-neJlnPHfPRd1tc14UDlWlBmpTOiXyskYFT9cz41WRxNMwKHCN_Ir-H0fFAVFndXMh2XUb6BCvYpTD2vGM7E1YJSM2gifIyz3Gfyoldkui8URqYTjJhUu2wI_8UsIEaOgEMeTbixRluc2le_MiiVVx3REwcMhU2OzIa-AtQAn_GC47G-WMEcZQq86sZE0ID9azGQJlw_lHhLwMWxhQbysFI2pT9XSJcnS0Wb1qxlrDDjD2wR8QX1CyB-GIqfO0-PLQIMNkYbArtuFjf47BoKdOKdfcgvvZUYprkp9spwzx_hjqP99kVmZla8w615uHOX6Lve6cdr_Q9Susjhxhm2vabIaN8f_YJg5Mlojony_KCLBwUWca9T1ZsNWEfvVlHUE79m0oIbqirFJnMOrCIvt568q6Y6GxOKGR7faEBAhjdHc5tRyFwGhgZyD8TQz9U66K-IF_Z5oKTBX_vOG-I7EtptQPfr4fq1GP_gV7hVFFpwKj6S-FC2v3yKyfdCa_XjvYWpM69IUHSdMswKe7VxcX-2p7C2JVeBPi-MDBDr-cDXxpdH6h3iXL8jT1gw1MXKzMwE6fk7U48G5uT7CMqe33NTa_YP6UEmnchyjeph_v7sG4gEQEixiE';

const USER_ID = '9984d17f-249e-4df3-a31d-09a2378a1ed4';
const PROJ_ID = 'proj-123';
const ENV_ID = 'env-123';

async function setupLocalStorage(page: Page): Promise<void> {
    await page.addInitScript(({ userId, projId, envId }: any) => {
        try {
            localStorage.setItem('userId', userId);
            localStorage.setItem('accountId', 'test-account');
            localStorage.setItem('project', JSON.stringify({ id: projId, name: 'Test Project' }));
            localStorage.setItem('environment', JSON.stringify({ id: envId, name: 'Test Env' }));
            localStorage.setItem('availableDeployments', JSON.stringify([]));
            localStorage.setItem('resourceUsage', JSON.stringify([]));
            const policies = [{ V0: userId, V4: 'ADMIN' }];
            localStorage.setItem('policies', JSON.stringify(policies));
        } catch (_e) { /* ignore */ }
    }, { userId: USER_ID, projId: PROJ_ID, envId: ENV_ID });
}

async function setupMocks(page: Page): Promise<void> {

    await page.route(/.*\/projects\/proj-123$/, async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: {
                    id: PROJ_ID,
                    name: 'Test Project',
                    github: { token: 'mock-gh-token', username: 'testuser' },
                    gitlab: { token: 'mock-gl-token', username: 'testuser' }
                }
            })
        });
    });

    await page.route(/.*\/public\/pricing-catalog$/, async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [
                    { instanceType: 'femto.m', price: 10, instanceHourRate: 10, cpuVcpu: '0.5', memoryGb: '0.5', currency: 'USD' },
                    { instanceType: 'medium.m', price: 20, instanceHourRate: 20, cpuVcpu: '1', memoryGb: '2', currency: 'USD' }
                ]
            })
        });
    });

    await page.route(/.*\/integrations\/vcs\/resources.*type=repositories/, async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [
                    { id: 101, name: 'repo-name', full_name: 'org/repo-name', default_branch: 'main', webhook: true }
                ]
            })
        });
    });

    await page.route(/.*\/integrations\/vcs\/resources.*type=branches/, async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'success', data: ['main', 'develop'] })
        });
    });

    await page.route(/.*\/deployment-management\/deployments$/, async route => {
        if (route.request().method() === 'POST') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: { id: 'dep-new', name: 'repo-name' },
                    message: 'Deployment created successfully'
                })
            });
        } else {
            await route.continue();
        }
    });

    await page.route(/.*\/live\/release\/stream.*/, r => r.abort());
    await page.route(/.*\/live\/deployment\/stream.*/, r => r.abort());
}


async function navigateToEnvVarsStep(page: Page): Promise<void> {
    await page.goto('/deployment/create-deployment');

    await page.locator('mat-select[formControlName="type"]').click();
    await page.locator('mat-option').filter({ hasText: 'GitHub' }).click();

    const repoSelect = page.locator('select[formControlName="selectedRepo"]');
    await expect(repoSelect).toBeVisible({ timeout: 8000 });
    await repoSelect.selectOption({ label: 'repo-name' });

    await page.locator('input[formControlName="port"]').fill('3000');

    await expect(page.locator('select[formControlName="branchName"]')).toHaveValue('main', { timeout: 6000 });

    await page.locator('button', { hasText: 'Save & Continue' }).click();

    await expect(page.locator('.step.active .label')).toContainText('Environment variable', { timeout: 8000 });

    await expect(page.locator('button', { hasText: 'New Variables' })).toBeVisible({ timeout: 8000 });
}

async function fillNewVariableForm(page: Page, name: string, value: string): Promise<void> {
    await page.locator('button', { hasText: 'New Variables' }).click();
    await expect(page.locator('input[formControlName="name"]').first()).toBeVisible({ timeout: 5000 });
    await page.locator('input[formControlName="name"]').first().fill(name);
    await page.locator('input[formControlName="value"]').first().fill(value);
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ token, userId }: any) => {
        try {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('accountId', 'test-account');
            const policies = [{ V0: userId, V4: 'ADMIN' }];
            localStorage.setItem('policies', JSON.stringify(policies));
        } catch (_e) { /* ignore */ }
    }, { token: ACCESS_TOKEN, userId: USER_ID });
});



test.describe('4.1.1 – Add Environment Variable Using Key–Value Fields', () => {

    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await navigateToEnvVarsStep(page);
    });

    test('4.1.1.1 – "New Variables" button toggles the inline add-variable form', async ({ page }) => {
        await expect(page.locator('input[formControlName="name"]')).toHaveCount(0);

        await page.locator('button', { hasText: 'New Variables' }).click();

        await expect(page.locator('input[formControlName="name"]').first()).toBeVisible();
        await expect(page.locator('input[formControlName="value"]').first()).toBeVisible();
        await expect(page.locator('button', { hasText: 'Add Env to List' })).toBeVisible();
        await expect(page.locator('button', { hasText: 'Cancel' })).toBeVisible();
    });

    test('4.1.1.2 – User fills NODE_ENV / production; "Add Env to List" is enabled', async ({ page }) => {
        await page.locator('button', { hasText: 'New Variables' }).click();

        const nameInput = page.locator('input[formControlName="name"]').first();
        const valueInput = page.locator('input[formControlName="value"]').first();

        await nameInput.fill('NODE_ENV');
        await valueInput.fill('production');

        await expect(page.locator('button', { hasText: 'Add Env to List' })).toBeEnabled();
    });

    test('4.1.1.3 – Variable is saved and appears in the environment variables list', async ({ page }) => {
        await fillNewVariableForm(page, 'NODE_ENV', 'production');
        await page.locator('button', { hasText: 'Add Env to List' }).click();

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.variable-value-wrapper span', { hasText: 'production' })).toBeVisible();
    });

    test('4.1.1.4 – Empty state "No Environment Variables" is shown when list is empty', async ({ page }) => {
        await expect(page.locator('.custom-content', { hasText: 'No Environment Variables' })).toBeVisible();
    });

    test('4.1.1.5 – Clicking "Save & Continue" advances stepper to Secrets page', async ({ page }) => {
        await fillNewVariableForm(page, 'NODE_ENV', 'production');
        await page.locator('button', { hasText: 'Add Env to List' }).click();
        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });

        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });

});


test.describe('4.1.2 – Add Environment Variables Using Raw Editor (ENV Format)', () => {


    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await navigateToEnvVarsStep(page);
    });

    test('4.1.2.1 – "Raw Editor" button is visible on the Environment Variables step', async ({ page }) => {
        await expect(page.locator('button', { hasText: 'Raw Editor' })).toBeVisible();
    });

    test('4.1.2.2 – Clicking "Raw Editor" opens the modal; ENV tab is active by default', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });


        await expect(page.locator('.tab-button', { hasText: 'ENV' })).toHaveClass(/active/);
        await expect(page.locator('.editor-textarea')).toBeVisible();
    });

    test('4.1.2.3 – User pastes .env content; "Update Variables" parses and closes modal', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill('NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com');

        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.variable-name', { hasText: 'PORT' })).toBeVisible();
        await expect(page.locator('.variable-name', { hasText: 'API_URL' })).toBeVisible();
    });

    test('4.1.2.4 – All valid .env variables are accepted; list reflects correct values', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill('NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com');
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.variable-value-wrapper span', { hasText: 'production' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.variable-value-wrapper span', { hasText: '3000' })).toBeVisible();
        await expect(page.locator('.variable-value-wrapper span', { hasText: 'https://api.example.com' })).toBeVisible();
    });

    test('4.1.2.5 – Clicking "Save & Continue" after raw-editor ENV update navigates to Secrets', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill('NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com');
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });

        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });

});



test.describe('4.1.3 – Add Environment Variables Using JSON Format', () => {


    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await navigateToEnvVarsStep(page);
    });

    test('4.1.3.1 – Switching to JSON tab shows the textarea for JSON input', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();
        await expect(page.locator('.tab-button', { hasText: 'JSON' })).toHaveClass(/active/);
        await expect(page.locator('.editor-textarea')).toBeVisible();
    });

    test('4.1.3.2 – User enters valid JSON; "Update Variables" is enabled', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();

        const validJson = JSON.stringify(
            { NODE_ENV: 'production', PORT: '3000', API_URL: 'https://api.example.com' },
            null, 2
        );
        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(validJson);

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeEnabled();
    });

    test('4.1.3.3 – Invalid JSON disables "Update Variables" button', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill('{ NODE_ENV: production, PORT: bad_json }'); // malformed

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeDisabled();
    });

    test('4.1.3.4 – "Update Variables" for JSON closes modal and populates the list', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();

        const validJson = JSON.stringify(
            { NODE_ENV: 'production', PORT: '3000', API_URL: 'https://api.example.com' },
            null, 2
        );
        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(validJson);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.variable-name', { hasText: 'PORT' })).toBeVisible();
        await expect(page.locator('.variable-name', { hasText: 'API_URL' })).toBeVisible();
    });

    test('4.1.3.5 – "Save & Continue" after JSON update navigates to Secrets page', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();

        const validJson = JSON.stringify(
            { NODE_ENV: 'production', PORT: '3000', API_URL: 'https://api.example.com' },
            null, 2
        );
        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(validJson);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });

        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });

});


test.describe('4.1.4 – Add Environment Variables by Uploading .env File', () => {

    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await navigateToEnvVarsStep(page);
    });

    test('4.1.4.1 – Raw Editor accepts .env file content pasted into textarea', async ({ page }) => {

        const envFileContent = 'NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await expect(page.locator('.tab-button', { hasText: 'ENV' })).toHaveClass(/active/);

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(envFileContent);

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeEnabled();
    });

    test('4.1.4.2 – System reads and parses .env file content correctly', async ({ page }) => {
        const envFileContent = 'NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(envFileContent);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();


        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.variable-name', { hasText: 'PORT' })).toBeVisible();
        await expect(page.locator('.variable-name', { hasText: 'API_URL' })).toBeVisible();
    });

    test('4.1.4.3 – Extracted variables are included in the deployment configuration', async ({ page }) => {
        const envFileContent = 'NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(envFileContent);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });

        const rows = page.locator('.variable-container');
        await expect(rows).toHaveCount(3, { timeout: 5000 });
    });

    test('4.1.4.4 – Clicking "Save & Continue" after .env upload navigates to Secrets page', async ({ page }) => {
        const envFileContent = 'NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.example.com';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(envFileContent);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();
        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });

        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });

});


test.describe('4.1.5 – Add Environment Variables by Uploading JSON File', () => {

    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await navigateToEnvVarsStep(page);
    });

    test('4.1.5.1 – Raw Editor (JSON tab) accepts JSON file content', async ({ page }) => {
        const jsonFileContent = JSON.stringify(
            { NODE_ENV: 'production', PORT: '3000', API_URL: 'https://api.example.com' },
            null, 2
        );

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();
        await expect(page.locator('.tab-button', { hasText: 'JSON' })).toHaveClass(/active/);

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(jsonFileContent);

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeEnabled();
    });

    test('4.1.5.2 – System validates JSON structure and disables button on invalid JSON', async ({ page }) => {
        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill('{ NODE_ENV: "production", PORT: bad }');

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeDisabled();
    });

    test('4.1.5.3 – JSON keys and values are correctly parsed and shown in the list', async ({ page }) => {
        const jsonFileContent = JSON.stringify(
            { NODE_ENV: 'production', PORT: '3000', API_URL: 'https://api.example.com' },
            null, 2
        );

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(jsonFileContent);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.variable-name', { hasText: 'PORT' })).toBeVisible();
        await expect(page.locator('.variable-name', { hasText: 'API_URL' })).toBeVisible();

        await expect(page.locator('.variable-value-wrapper span', { hasText: 'production' })).toBeVisible();
        await expect(page.locator('.variable-value-wrapper span', { hasText: '3000' })).toBeVisible();
    });

    test('4.1.5.4 – Clicking "Save & Continue" after JSON file upload navigates to Secrets page', async ({ page }) => {
        const jsonFileContent = JSON.stringify(
            { NODE_ENV: 'production', PORT: '3000', API_URL: 'https://api.example.com' },
            null, 2
        );

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(jsonFileContent);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();
        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });

        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });




});


test.describe('4.2 – Negative – Create Environment Variables', () => {

    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await navigateToEnvVarsStep(page);
    });


    test('4.2.1 – Empty variable name keeps "Add Env to List" disabled', async ({ page }) => {
        await page.locator('button', { hasText: 'New Variables' }).click();
        await expect(page.locator('input[formControlName="name"]').first()).toBeVisible();

        await page.locator('input[formControlName="value"]').first().fill('production');
        await page.locator('input[formControlName="name"]').first().blur();

        await expect(page.locator('button', { hasText: 'Add Env to List' })).toBeDisabled();

        await expect(page.locator('.variable-container')).toHaveCount(0);

        await expect(page.locator('.custom-content', { hasText: 'No Environment Variables' })).toBeVisible();
    });


    test('4.2.2 – Empty value with name filled shows cross-field validation error', async ({ page }) => {
        await page.locator('button', { hasText: 'New Variables' }).click();

        const nameInput = page.locator('input[formControlName="name"]').first();
        const valueInput = page.locator('input[formControlName="value"]').first();

        await nameInput.fill('NODE_ENV');

        await valueInput.click();
        await nameInput.blur();

        await valueInput.blur();

        await expect(
            page.locator('small.text-danger', { hasText: 'Value is required if name is provided.' })
        ).toBeVisible({ timeout: 5000 });

        await expect(page.locator('button', { hasText: 'Add Env to List' })).toBeDisabled();

        await expect(page.locator('.variable-container')).toHaveCount(0);
    });

    test('4.2.3 – Both name and value empty keeps "Add Env to List" disabled', async ({ page }) => {
        await page.locator('button', { hasText: 'New Variables' }).click();

        await page.locator('input[formControlName="name"]').first().click();
        await page.locator('input[formControlName="value"]').first().click();
        await page.locator('input[formControlName="name"]').first().blur();
        await page.locator('input[formControlName="value"]').first().blur();

        await expect(page.locator('button', { hasText: 'Add Env to List' })).toBeDisabled();

        await expect(page.locator('.variable-container')).toHaveCount(0);
    });


    test('4.2.4 – Duplicate variable name overwrites existing entry (current behaviour)', async ({ page }) => {

        await fillNewVariableForm(page, 'NODE_ENV', 'production');
        await page.locator('button', { hasText: 'Add Env to List' }).click();
        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });

        await fillNewVariableForm(page, 'NODE_ENV', 'staging');
        await page.locator('button', { hasText: 'Add Env to List' }).click();


        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toHaveCount(1, { timeout: 5000 });


        await expect(
            page.locator('.variable-value-wrapper span', { hasText: 'staging' })
        ).toBeVisible({ timeout: 5000 });

    });


    test('4.2.5 – Invalid .env lines are silently skipped; valid lines still parsed', async ({ page }) => {
        const invalidEnvContent = 'NODE_ENV production\nPORT:3000';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await expect(page.locator('.tab-button', { hasText: 'ENV' })).toHaveClass(/active/);

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(invalidEnvContent);

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeEnabled();

        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });

        await expect(page.locator('.custom-content', { hasText: 'No Environment Variables' })).toBeVisible();
    });

    test('4.2.6 – Invalid JSON disables "Update Variables" and prevents variable import', async ({ page }) => {
        const malformedJson = '{\n  "NODE_ENV": "production",\n  "PORT": 3000,';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();
        await expect(page.locator('.tab-button', { hasText: 'JSON' })).toHaveClass(/active/);

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(malformedJson);

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeDisabled();

        await page.locator('button.cancel-button').click();
        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });
        await expect(page.locator('.custom-content', { hasText: 'No Environment Variables' })).toBeVisible();
    });

    test('4.2.7 – "Save & Continue" with no env vars navigates to Secrets page', async ({ page }) => {
        await expect(page.locator('.custom-content', { hasText: 'No Environment Variables' })).toBeVisible();

        await page.locator('button', { hasText: 'Save & Continue' }).click();

        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });

    test('4.2.8 – Partially invalid .env content: valid lines parsed, invalid lines skipped', async ({ page }) => {
        const mixedEnv = 'NODE_ENV=production\nPORT\n=3000\nAPI URL=https://api.example';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(mixedEnv);
        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();

        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });

        await expect(page.locator('.variable-name', { hasText: 'NODE_ENV' })).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.variable-value-wrapper span', { hasText: 'production' })).toBeVisible();

        await expect(page.locator('.variable-container')).toHaveCount(1);

        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });

    test('4.2.9 – Raw Editor textarea accepts plain text (no file-type validation currently)', async ({ page }) => {
        const txtFileContent = 'This is plain text. NO_EQUAL_SIGN. Not a valid env format.';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(txtFileContent);

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeEnabled();

        await page.locator('.action-buttons button', { hasText: 'Update Variables' }).click();
        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });

        await expect(page.locator('.custom-content', { hasText: 'No Environment Variables' })).toBeVisible();
    });

    test('4.2.10 – Malformed JSON file content disables "Update Variables" and imports nothing', async ({ page }) => {
        const malformedJsonFileContent = '{\n  "NODE_ENV": "production",\n  "PORT": 3000,';

        await page.locator('button', { hasText: 'Raw Editor' }).click();
        await expect(page.locator('.raw-editor-container')).toBeVisible({ timeout: 6000 });

        await page.locator('.tab-button', { hasText: 'JSON' }).click();
        await expect(page.locator('.tab-button', { hasText: 'JSON' })).toHaveClass(/active/);

        const textarea = page.locator('.editor-textarea');
        await textarea.click();
        await page.keyboard.press('Control+A');
        await textarea.fill(malformedJsonFileContent);

        await expect(page.locator('.action-buttons button', { hasText: 'Update Variables' })).toBeDisabled();

        await page.locator('button.cancel-button').click();
        await expect(page.locator('.raw-editor-container')).toHaveCount(0, { timeout: 5000 });
        await expect(page.locator('.variable-container')).toHaveCount(0);
        await expect(page.locator('.custom-content', { hasText: 'No Environment Variables' })).toBeVisible();

        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toContainText('Secrets', { timeout: 8000 });
    });

});