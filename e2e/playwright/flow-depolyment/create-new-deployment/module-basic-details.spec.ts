
import { test, expect, Page } from '@playwright/test';


test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('accessToken', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Im5pbWJ1ei1jZXJ0IiwidHlwIjoiSldUIn0.eyJvd25lciI6Im5pbWJ1eiIsIm5hbWUiOiJEZXYiLCJjcmVhdGVkVGltZSI6IjIwMjUtMTItMzBUMTM6MDI6MjZaIiwidXBkYXRlZFRpbWUiOiIyMDI1LTEyLTMwVDEzOjA1OjQwWiIsImRlbGV0ZWRUaW1lIjoiIiwiaWQiOiJiODQ0ZmNkYS05ZWJkLTQwOTUtYmYxYy0yZWUwYThiNDA2YTAiLCJ0eXBlIjoiIiwicGFzc3dvcmQiOiIiLCJwYXNzd29yZFNhbHQiOiIiLCJwYXNzd29yZFR5cGUiOiJwbGFpbiIsImRpc3BsYXlOYW1lIjoiRGV2IiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIiLCJhdmF0YXIiOiIiLCJhdmF0YXJUeXBlIjoiIiwicGVybWFuZW50QXZhdGFyIjoiIiwiZW1haWwiOiJtYW5vcmFuaml0aC5wZEBnbWFpbC5jb20iLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwicGhvbmUiOiIiLCJjb3VudHJ5Q29kZSI6IiIsInJlZ2lvbiI6IiIsImxvY2F0aW9uIjoiIiwiYWRkcmVzcyI6W10sImFmZmlsaWF0aW9uIjoiIiwidGl0bGUiOiIiLCJpZENhcmRUeXBlIjoiIiwiaWRDYXJkIjoiIiwiaG9tZXBhZ2UiOiIiLCJiaW8iOiIiLCJsYW5ndWFnZSI6IiIsImdlbmRlciI6IiIsImJpcnRoZGF5IjoiIiwiZWR1Y2F0aW9uIjoiIiwic2NvcmUiOjAsImthcm1hIjowLCJyYW5raW5nIjo1LCJpc0RlZmF1bHRBdmF0YXIiOmZhbHNlLCJpc09ubGluZSI6ZmFsc2UsImlzQWRtaW4iOmZhbHNlLCJpc0ZvcmJpZGRlbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsInNpZ251cEFwcGxpY2F0aW9uIjoibmltYnV6IiwiaGFzaCI6IiIsInByZUhhc2giOiIiLCJhY2Nlc3NLZXkiOiIiLCJhY2Nlc3NTZWNyZXQiOiIiLCJnaXRodWIiOiIiLCJnb29nbGUiOiIiLCJxcSI6IiIsIndlY2hhdCI6IiIsImZhY2Vib29rIjoiIiwiZGluZ3RhbGsiOiIiLCJ3ZWlibyI6IiIsImdpdGVlIjoiIiwibGlua2VkaW4iOiIiLCJ3ZWNvbSI6IiIsImxhcmsiOiIiLCJnaXRsYWIiOiIiLCJjcmVhdGVkSXAiOiIiLCJsYXN0U2lnbmluVGltZSI6IiIsImxhc3RTaWduaW5JcCI6IiIsInByZWZlcnJlZE1mYVR5cGUiOiIiLCJyZWNvdmVyeUNvZGVzIjpudWxsLCJ0b3RwU2VjcmV0IjoiIiwibWZhUGhvbmVFbmFibGVkIjpmYWxzZSwibWZhRW1haWxFbmFibGVkIjpmYWxzZSwibGRhcCI6IiIsInByb3BlcnRpZXMiOnsiYnVzaW5lc3NOYW1lIjoibmltYnV6IiwiaXNWZXJpZmllZCI6InRydWUiLCJuaW1idXpBY2NvdW50SWQiOiJiNjliZjczYi05ZGIwLTQ1M2QtOTZlNS00MzMwYmY2YjNkYzYiLCJuaW1idXpVc2VySWQiOiI5OTg0ZDE3Zi0yNDllLTRkZjMtYTMxZC0wOWEyMzc4YTFlZDQiLCJ0eXBlIjoiaW5kaXZpZHVhbCJ9LCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwiZ3JvdXBzIjpbXSwibGFzdFNpZ25pbldyb25nVGltZSI6IiIsInNpZ25pbldyb25nVGltZXMiOjAsIm1hbmFnZWRBY2NvdW50cyI6bnVsbCwidG9rZW5UeXBlIjoiYWNjZXNzLXRva2VuIiwidGFnIjoiIiwiYXpwIjoibmltYnV6IiwiaXNzIjoiaHR0cHM6Ly9jYXNkb29yLmRldi5uaW1idXoudGVjaCIsInN1YiI6ImI4NDRmY2RhLTllYmQtNDA5NS1iZjFjLTJlZTBhOGI0MDZhMCIsImF1ZCI6WyJuaW1idXoiXSwiZXhwIjoxNzcxODI0NTQwLCJuYmYiOjE3NzEyMTk3NDAsImlhdCI6MTc3MTIxOTc0MCwianRpIjoiYWRtaW4vMmRhMjUyMmEtMjIxMS00NDVhLThmYTQtZmYyZjlkYTM4NjE3In0.kP6-qFY2hPWC7E-o2HGUwScONBEW8z9ru91QZyB-9kur-36Xe_FzY-neJlnPHfPRd1tc14UDlWlBmpTOiXyskYFT9cz41WRxNMwKHCN_Ir-H0fFAVFndXMh2XUb6BCvYpTD2vGM7E1YJSM2gifIyz3Gfyoldkui8URqYTjJhUu2wI_8UsIEaOgEMeTbixRluc2le_MiiVVx3REwcMhU2OzIa-AtQAn_GC47G-WMEcZQq86sZE0ID9azGQJlw_lHhLwMWxhQbysFI2pT9XSJcnS0Wb1qxlrDDjD2wR8QX1CyB-GIqfO0-PLQIMNkYbArtuFjf47BoKdOKdfcgvvZUYprkp9spwzx_hjqP99kVmZla8w615uHOX6Lve6cdr_Q9Susjhxhm2vabIaN8f_YJg5Mlojony_KCLBwUWca9T1ZsNWEfvVlHUE79m0oIbqirFJnMOrCIvt568q6Y6GxOKGR7faEBAhjdHc5tRyFwGhgZyD8TQz9U66K-IF_Z5oKTBX_vOG-I7EtptQPfr4fq1GP_gV7hVFFpwKj6S-FC2v3yKyfdCa_XjvYWpM69IUHSdMswKe7VxcX-2p7C2JVeBPi-MDBDr-cDXxpdH6h3iXL8jT1gw1MXKzMwE6fk7U48G5uT7CMqe33NTa_YP6UEmnchyjeph_v7sG4gEQEixiE');
            localStorage.setItem('userId', '9984d17f-249e-4df3-a31d-09a2378a1ed4');
            localStorage.setItem('accountId', 'test-account');
            const policies = [{ V0: '9984d17f-249e-4df3-a31d-09a2378a1ed4', V4: 'ADMIN' }];
            localStorage.setItem('policies', JSON.stringify(policies));
        } catch (e) { }
    });
});

async function setupLocalStorage(page: Page) {
    await page.addInitScript(() => {
        const user = {
            id: '9984d17f-249e-4df3-a31d-09a2378a1ed4',
            owner: 'nimbuz',
            email: 'test@example.com'
        };

        const project = { id: 'proj-123', name: 'Test Project' };
        const environment = { id: 'env-123', name: 'Test Env' };

        if (!localStorage.getItem('accessToken')) {
            localStorage.setItem('accessToken', 'mock-token');
        }
        localStorage.setItem('userId', user.id);
        localStorage.setItem('project', JSON.stringify(project));
        localStorage.setItem('environment', JSON.stringify(environment));
        localStorage.setItem('availableDeployments', JSON.stringify(['existing-app']));
    });
}


async function setupMocks(page: Page) {

    await page.route(/.*\/projects\/proj-123$/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: {
                    id: 'proj-123',
                    name: 'Test Project',
                    github: { token: 'mock-gh-token', username: 'testuser' }, // Authenticated
                    gitlab: { token: 'mock-gl-token', username: 'testuser' }
                }
            })
        });
    });

    await page.route(/.*\/public\/pricing-catalog$/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [
                    { instanceType: 'femto.m', price: 10, cpuVcpu: '0.5', memoryGb: '0.5' }, // Small/Min
                    { instanceType: 'medium.m', price: 20, cpuVcpu: '1', memoryGb: '2' },   // Medium
                    { instanceType: 'large.m', price: 40, cpuVcpu: '2', memoryGb: '4' }
                ]
            })
        });
    });


    await page.route(/.*\/integrations\/vcs\/resources.*type=repositories/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [
                    { id: 101, name: 'repo-name', full_name: 'org/repo-name', default_branch: 'main', webhook: true },
                    { id: 102, name: 'other-repo', full_name: 'org/other-repo', default_branch: 'dev', webhook: false }
                ]
            })
        });
    });

    await page.route(/.*\/integrations\/vcs\/resources.*type=branches/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: ['main', 'develop', 'feature-branch']
            })
        });
    });

    await page.route(/.*\/deployment-management\/deployments$/, async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: { id: 'dep-123', name: 'repo-name' },
                    message: 'Deployment created successfully'
                })
            });
        } else {
            await route.continue();
        }
    });
}

test.describe('3.1 - Create New Deployment - Positive Basic Details', () => {

    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await page.goto('/deployment/create-deployment');
    });

    test('3.1.1 – Create Deployment with Default Prefilled Values', async ({ page }) => {

        await page.locator('mat-select[formControlName="type"]').click();
        await page.locator('mat-option').filter({ hasText: 'GitHub' }).click();

        const repoSelect = page.locator('select[formControlName="selectedRepo"]');
        await expect(repoSelect).toBeVisible();
        await repoSelect.selectOption({ label: 'repo-name' });

        const nameInput = page.locator('input[formControlName="name"]');
        await expect(nameInput).toHaveValue('repo-name');

        const replicasInput = page.locator('input[formControlName="replicas"]');
        await expect(replicasInput).toHaveValue('1');

        const instanceSelect = page.locator('select[formControlName="instanceType"]');
        const selectedOption = instanceSelect.locator('option:checked');
        await expect(selectedOption).toHaveText(/femto\.m/);

        await page.locator('input[formControlName="port"]').fill('3000');

        await expect(page.locator('select[formControlName="branchName"]')).toHaveValue('main', { timeout: 5000 });

        const nextBtn = page.locator('button', { hasText: 'Save & Continue' });
        await expect(nextBtn).toBeEnabled();
        await nextBtn.click();

        const activeStep = page.locator('.step.active .label');
        await expect(activeStep).toHaveText('Environment variable', { timeout: 5000 });
    });

    test('3.1.2 – Create Deployment With Edited Deployment Name', async ({ page }) => {
        await page.locator('mat-select[formControlName="type"]').click();
        await page.locator('mat-option').filter({ hasText: 'GitHub' }).click();
        await page.locator('select[formControlName="selectedRepo"]').selectOption({ label: 'repo-name' });

        const nameInput = page.locator('input[formControlName="name"]');
        await expect(nameInput).toHaveValue('repo-name');
        await nameInput.fill('user-service-prod');
        await nameInput.blur();

        await expect(nameInput).toHaveValue('user-service-prod');

        await page.locator('input[formControlName="port"]').fill('3000');
        await expect(page.locator('select[formControlName="branchName"]')).toHaveValue('main');
        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toHaveText('Environment variable');
    });

    test('3.1.3 – Create Deployment With Multiple Replicas', async ({ page }) => {
        await page.locator('mat-select[formControlName="type"]').click();
        await page.locator('mat-option').filter({ hasText: 'GitHub' }).click();
        await page.locator('select[formControlName="selectedRepo"]').selectOption({ label: 'repo-name' });

        const replicasInput = page.locator('input[formControlName="replicas"]');
        await replicasInput.fill('3');

        await page.locator('input[formControlName="port"]').fill('3000');
        await expect(page.locator('select[formControlName="branchName"]')).toHaveValue('main');
        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toHaveText('Environment variable');
    });

    test('3.1.4 – Create Deployment With Different Instance Type', async ({ page }) => {
        await page.locator('mat-select[formControlName="type"]').click();
        await page.locator('mat-option').filter({ hasText: 'GitHub' }).click();
        await page.locator('select[formControlName="selectedRepo"]').selectOption({ label: 'repo-name' });

        const instanceSelect = page.locator('select[formControlName="instanceType"]');
        await instanceSelect.selectOption({ label: 'medium.m' });

        await page.locator('input[formControlName="port"]').fill('3000');
        await expect(page.locator('select[formControlName="branchName"]')).toHaveValue('main');
        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toHaveText('Environment variable');
    });

    test('3.1.5 – Create Deployment with Optional Fields', async ({ page }) => {
        await page.locator('mat-select[formControlName="type"]').click();
        await page.locator('mat-option').filter({ hasText: 'GitHub' }).click();
        await page.locator('select[formControlName="selectedRepo"]').selectOption({ label: 'repo-name' });

        await page.locator('input[formControlName="dockerfilePath"]').fill('/docker/Dockerfile');
        await page.locator('input[formControlName="healthEndpoint"]').fill('/health');
        await page.locator('input[formControlName="ephemeralStorage"]').fill('5'); // 5Gi

        await page.locator('input[formControlName="port"]').fill('8080');
        await expect(page.locator('select[formControlName="branchName"]')).toHaveValue('main');
        await page.locator('button', { hasText: 'Save & Continue' }).click();
        await expect(page.locator('.step.active .label')).toHaveText('Environment variable');
    });

});

test.describe('3.2 - Create New Deployment - Negative Basic Details', () => {

    test.beforeEach(async ({ page }) => {
        await setupLocalStorage(page);
        await setupMocks(page);
        await page.goto('/deployment/create-deployment');

        await page.locator('mat-select[formControlName="type"]').click();
        await page.locator('mat-option').filter({ hasText: 'GitHub' }).click();
        await page.waitForTimeout(500);
    });

    test('3.2.1 – Empty Deployment Name', async ({ page }) => {
        const nameInput = page.locator('input[formControlName="name"]');

        await nameInput.fill('temp-name');
        await nameInput.clear();
        await nameInput.blur();

        const errorMsg = page.locator('div.text-danger', { hasText: 'This field is required.' });
        await expect(errorMsg).toBeVisible();

        const nextBtn = page.locator('button', { hasText: 'Save & Continue' });
        await expect(nextBtn).toBeDisabled();
    });

    test('3.2.2 – Invalid Deployment Name Format', async ({ page }) => {
        const nameInput = page.locator('input[formControlName="name"]');

        await nameInput.fill('My_App!');
        await nameInput.blur();

        const errorMsg = page.locator('div.text-danger', { hasText: 'Name must start with a lowercase letter' });
        await expect(errorMsg).toBeVisible();
        await expect(page.locator('button', { hasText: 'Save & Continue' })).toBeDisabled();
    });

    test('3.2.3 – Replicas Set to Zero', async ({ page }) => {
        const replicasInput = page.locator('input[formControlName="replicas"]');

        await replicasInput.fill('0');
        await replicasInput.blur();
    });

    test('3.2.4 – Negative Replicas Value', async ({ page }) => {
        const replicasInput = page.locator('input[formControlName="replicas"]');

        await replicasInput.fill('-1');
        await replicasInput.blur();

        const errorMsg = page.locator('div.text-danger', { hasText: 'Only numbers are allowed.' });
        await expect(errorMsg).toBeVisible();
        await expect(page.locator('button', { hasText: 'Save & Continue' })).toBeDisabled();
    });

    test('3.2.5 – Non-numeric Replicas Value', async ({ page }) => {
        const replicasInput = page.locator('input[formControlName="replicas"]');
        await replicasInput.fill('abc');
        await replicasInput.blur();

        const errorMsg = page.locator('div.text-danger', { hasText: 'Only numbers are allowed.' });
        await expect(errorMsg).toBeVisible();
    });

    test('3.2.6 – Port Field Empty', async ({ page }) => {
        const portInput = page.locator('input[formControlName="port"]');

    });

    test('3.2.7 – Invalid Port Number', async ({ page }) => {
        const portInput = page.locator('input[formControlName="port"]');

        await portInput.fill('70000');
        await portInput.blur();

        const errorMsg = page.locator('div.text-danger', { hasText: 'Invalid Port Number Entered' });
        await expect(errorMsg).toBeVisible();
        await expect(page.locator('button', { hasText: 'Save & Continue' })).toBeDisabled();
    });

    test('3.2.8 – Invalid Health Endpoint Format', async ({ page }) => {
        const healthInput = page.locator('input[formControlName="healthEndpoint"]');

        await healthInput.fill('health');
        await healthInput.blur();

    });

    test('3.2.9 – Invalid Ephemeral Storage Value', async ({ page }) => {
        const storageInput = page.locator('input[formControlName="ephemeralStorage"]');


        await storageInput.fill('abc');
        await storageInput.blur();

        const errorMsg = page.locator('div.text-danger', { hasText: 'Only numbers are allowed' });
        await expect(errorMsg).toBeVisible();
    });

    test('3.2.10 – Save & Continue Without Required Fields', async ({ page }) => {

        await page.locator('select[formControlName="selectedRepo"]').selectOption({ label: 'repo-name' });

        await page.locator('input[formControlName="name"]').clear();
        await page.locator('input[formControlName="name"]').blur();

        const nextBtn = page.locator('button', { hasText: 'Save & Continue' });
        await expect(nextBtn).toBeDisabled();

        await expect(page.locator('div.text-danger', { hasText: 'This field is required' })).toBeVisible();
    });

});
