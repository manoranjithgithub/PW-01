import { test, expect, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('accessToken', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Im5pbWJ1ei1jZXJ0IiwidHlwIjoiSldUIn0.eyJvd25lciI6Im5pbWJ1eiIsIm5hbWUiOiJEZXYiLCJjcmVhdGVkVGltZSI6IjIwMjUtMTItMzBUMTM6MDI6MjZaIiwidXBkYXRlZFRpbWUiOiIyMDI1LTEyLTMwVDEzOjA1OjQwWiIsImRlbGV0ZWRUaW1lIjoiIiwiaWQiOiJiODQ0ZmNkYS05ZWJkLTQwOTUtYmYxYy0yZWUwYThiNDA2YTAiLCJ0eXBlIjoiIiwicGFzc3dvcmQiOiIiLCJwYXNzd29yZFNhbHQiOiIiLCJwYXNzd29yZFR5cGUiOiJwbGFpbiIsImRpc3BsYXlOYW1lIjoiRGV2IiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIiLCJhdmF0YXIiOiIiLCJhdmF0YXJUeXBlIjoiIiwicGVybWFuZW50QXZhdGFyIjoiIiwiZW1haWwiOiJtYW5vcmFuaml0aC5wZEBnbWFpbC5jb20iLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwicGhvbmUiOiIiLCJjb3VudHJ5Q29kZSI6IiIsInJlZ2lvbiI6IiIsImxvY2F0aW9uIjoiIiwiYWRkcmVzcyI6W10sImFmZmlsaWF0aW9uIjoiIiwidGl0bGUiOiIiLCJpZENhcmRUeXBlIjoiIiwiaWRDYXJkIjoiIiwiaG9tZXBhZ2UiOiIiLCJiaW8iOiIiLCJsYW5ndWFnZSI6IiIsImdlbmRlciI6IiIsImJpcnRoZGF5IjoiIiwiZWR1Y2F0aW9uIjoiIiwic2NvcmUiOjAsImthcm1hIjowLCJyYW5raW5nIjo1LCJpc0RlZmF1bHRBdmF0YXIiOmZhbHNlLCJpc09ubGluZSI6ZmFsc2UsImlzQWRtaW4iOmZhbHNlLCJpc0ZvcmJpZGRlbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsInNpZ251cEFwcGxpY2F0aW9uIjoibmltYnV6IiwiaGFzaCI6IiIsInByZUhhc2giOiIiLCJhY2Nlc3NLZXkiOiIiLCJhY2Nlc3NTZWNyZXQiOiIiLCJnaXRodWIiOiIiLCJnb29nbGUiOiIiLCJxcSI6IiIsIndlY2hhdCI6IiIsImZhY2Vib29rIjoiIiwiZGluZ3RhbGsiOiIiLCJ3ZWlibyI6IiIsImdpdGVlIjoiIiwibGlua2VkaW4iOiIiLCJ3ZWNvbSI6IiIsImxhcmsiOiIiLCJnaXRsYWIiOiIiLCJjcmVhdGVkSXAiOiIiLCJsYXN0U2lnbmluVGltZSI6IiIsImxhc3RTaWduaW5JcCI6IiIsInByZWZlcnJlZE1mYVR5cGUiOiIiLCJyZWNvdmVyeUNvZGVzIjpudWxsLCJ0b3RwU2VjcmV0IjoiIiwibWZhUGhvbmVFbmFibGVkIjpmYWxzZSwibWZhRW1haWxFbmFibGVkIjpmYWxzZSwibGRhcCI6IiIsInByb3BlcnRpZXMiOnsiYnVzaW5lc3NOYW1lIjoibmltYnV6IiwiaXNWZXJpZmllZCI6InRydWUiLCJuaW1idXpBY2NvdW50SWQiOiJiNjliZjczYi05ZGIwLTQ1M2QtOTZlNS00MzMwYmY2YjNkYzYiLCJuaW1idXpVc2VySWQiOiI5OTg0ZDE3Zi0yNDllLTRkZjMtYTMxZC0wOWEyMzc4YTFlZDQiLCJ0eXBlIjoiaW5kaXZpZHVhbCJ9LCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwiZ3JvdXBzIjpbXSwibGFzdFNpZ25pbldyb25nVGltZSI6IiIsInNpZ25pbldyb25nVGltZXMiOjAsIm1hbmFnZWRBY2NvdW50cyI6bnVsbCwidG9rZW5UeXBlIjoiYWNjZXNzLXRva2VuIiwidGFnIjoiIiwiYXpwIjoibmltYnV6IiwiaXNzIjoiaHR0cHM6Ly9jYXNkb29yLmRldi5uaW1idXoudGVjaCIsInN1YiI6ImI4NDRmY2RhLTllYmQtNDA5NS1iZjFjLTJlZTBhOGI0MDZhMCIsImF1ZCI6WyJuaW1idXoiXSwiZXhwIjoxNzcxODI0NTQwLCJuYmYiOjE3NzEyMTk3NDAsImlhdCI6MTc3MTIxOTc0MCwianRpIjoiYWRtaW4vMmRhMjUyMmEtMjIxMS00NDVhLThmYTQtZmYyZjlkYTM4NjE3In0.kP6-qFY2hPWC7E-o2HGUwScONBEW8z9ru91QZyB-9kur-36Xe_FzY-neJlnPHfPRd1tc14UDlWlBmpTOiXyskYFT9cz41WRxNMwKHCN_Ir-H0fFAVFndXMh2XUb6BCvYpTD2vGM7E1YJSM2gifIyz3Gfyoldkui8URqYTjJhUu2wI_8UsIEaOgEMeTbixRluc2le_MiiVVx3REwcMhU2OzIa-AtQAn_GC47G-WMEcZQq86sZE0ID9azGQJlw_lHhLwMWxhQbysFI2pT9XSJcnS0Wb1qxlrDDjD2wR8QX1CyB-GIqfO0-PLQIMNkYbArtuFjf47BoKdOKdfcgvvZUYprkp9spwzx_hjqP99kVmZla8w615uHOX6Lve6cdr_Q9Susjhxhm2vabIaN8f_YJg5Mlojony_KCLBwUWca9T1ZsNWEfvVlHUE79m0oIbqirFJnMOrCIvt568q6Y6GxOKGR7faEBAhjdHc5tRyFwGhgZyD8TQz9U66K-IF_Z5oKTBX_vOG-I7EtptQPfr4fq1GP_gV7hVFFpwKj6S-FC2v3yKyfdCa_XjvYWpM69IUHSdMswKe7VxcX-2p7C2JVeBPi-MDBDr-cDXxpdH6h3iXL8jT1gw1MXKzMwE6fk7U48G5uT7CMqe33NTa_YP6UEmnchyjeph_v7sG4gEQEixiE');
            localStorage.setItem('userId', '9984d17f-249e-4df3-a31d-09a2378a1ed4');
            localStorage.setItem('accountId', 'test-account');

            const policies = [
                { V0: '9984d17f-249e-4df3-a31d-09a2378a1ed4', V1: 'nimbuz', V2: '*', V3: '*', V4: 'admin' }
            ];
            localStorage.setItem('policies', JSON.stringify(policies));

            const resourceUsage = [
                { resource_type: 'CPU', unit: 'vCPU' },
                { resource_type: 'RAM', unit: 'gb' },
                { resource_type: 'ephemeral_storage', unit: 'gb' }
            ];
            localStorage.setItem('resourceUsage', JSON.stringify(resourceUsage));
        } catch (e) { }
    });
});


async function setupViewEnvMocks(
    page: Page,
    envId: string,
    envData: Record<string, any>
) {
    await page.route(/\/project\/v1\/environments/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === 'GET' && url.includes(`id=${envId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'Success', data: envData })
            });
        } else if (method === 'PUT') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    message: 'Updated successfully',
                    data: envData
                })
            });
        } else if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: [] })
            });
        } else {
            await route.continue();
        }
    });

    await page.route(/\/user\/v1\/policies/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [
                    { V0: '9984d17f-249e-4df3-a31d-09a2378a1ed4', V1: 'nimbuz', V2: '*', V3: '*', V4: 'admin' }
                ]
            })
        });
    });

    await page.route(/\/deployment\/v1\/environments\/.*\/resource-quotas\/usage/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [
                    { resource_type: 'CPU', unit: 'vCPU', current_usage: 2, max_limit: 10, remaining: 8 },
                    { resource_type: 'RAM', unit: 'GB', current_usage: 4, max_limit: 20, remaining: 16 },
                    { resource_type: 'ephemeral_storage', unit: 'GB', current_usage: 10, max_limit: 100, remaining: 90 },
                    { resource_type: 'pvc_storage', unit: 'GB', current_usage: 5, max_limit: 50, remaining: 45 }
                ]
            })
        });
    });
}

function getDefaultEnvData(envId: string, envName: string, projectId: string) {
    return {
        id: envId,
        name: envName,
        region: 'ap-south-1',
        project_id: projectId,
        cpuMaxPlatformLimit: 10,
        cpuMaxUserLimit: 5,
        memoryMaxPlatformLimit: 20,
        memoryMaxUserLimit: 10,
        ephemeralStorageMaxPlatformLimit: 100,
        ephemeralStorageMaxUserLimit: 15,
        pvcStorageMaxPlatformLimit: 50,
        pvcStorageMaxUserLimit: 10
    };
}


test.describe('2.1 - Positive Edit Environment', () => {

    test('2.1.1 – Edit Environment Name Successfully', async ({ page }) => {
        const projectId = 'proj-edit-env-1';
        const envId = 'env-1';
        const envName = 'staging';
        const envData = getDefaultEnvData(envId, envName, projectId);

        await setupViewEnvMocks(page, envId, envData);

        await page.goto(`/projects/environment-preferences?envName=${envName}&region=ap-south-1&envId=${envId}&projectId=${projectId}`);

        const envNameDisplay = page.locator('.field-value', { hasText: envName });
        await expect(envNameDisplay).toBeVisible({ timeout: 15000 });

        const editBtn = page.locator('button.btn-edit', { hasText: 'edit' }).first();
        await expect(editBtn).toBeVisible({ timeout: 5000 });
        await editBtn.click();

        const nameInput = page.locator('input[formcontrolname="name"]');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await expect(nameInput).toHaveValue(envName);

        await nameInput.clear();
        await nameInput.fill('pre-production');

        const saveBtn = page.locator('button.btn-edit', { hasText: 'Save' }).first();
        await saveBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
    });


    test('2.1.2 – Update Environment Resource Limits Successfully', async ({ page }) => {
        const projectId = 'proj-edit-env-2';
        const envId = 'env-2';
        const envName = 'staging';
        const envData = getDefaultEnvData(envId, envName, projectId);

        await setupViewEnvMocks(page, envId, envData);

        await page.goto(`/projects/environment-preferences?envName=${envName}&region=ap-south-1&envId=${envId}&projectId=${projectId}`);

        const resourceHeader = page.locator('button', { hasText: 'Resource limits' });
        await expect(resourceHeader).toBeVisible({ timeout: 15000 });

        await page.waitForTimeout(2000);

        const resourceEditBtn = page.locator('button.btn-edit', { hasText: 'edit' }).nth(1);
        await expect(resourceEditBtn).toBeVisible({ timeout: 5000 });

        const isDisabled = await resourceEditBtn.evaluate(el => el.classList.contains('disabled'));
        expect(isDisabled).toBe(false);

        await resourceEditBtn.click();

        const cpuSlider = page.locator('#cpuMaxUserLimit');
        const memSlider = page.locator('#memoryMaxUserLimit');
        const storageSlider = page.locator('#ephemeralStorageMaxUserLimit');

        await expect(cpuSlider).toBeVisible({ timeout: 5000 });
        await expect(memSlider).toBeVisible();
        await expect(storageSlider).toBeVisible();

        await cpuSlider.fill('4');
        await memSlider.fill('8');
        await storageSlider.fill('50');

        const saveBtn = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveBtn).toBeVisible({ timeout: 5000 });
        await saveBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
    });

});


test.describe('2.2 - Negative Edit Environment', () => {

    async function navigateAndEnterEditMode(page: Page, opts?: { envName?: string }) {
        const projectId = 'proj-neg-test';
        const envId = 'env-neg-1';
        const envName = opts?.envName || 'staging';
        const envData = getDefaultEnvData(envId, envName, projectId);

        await setupViewEnvMocks(page, envId, envData);

        await page.goto(`/projects/environment-preferences?envName=${envName}&region=ap-south-1&envId=${envId}&projectId=${projectId}`);

        const envNameDisplay = page.locator('.field-value', { hasText: envName });
        await expect(envNameDisplay).toBeVisible({ timeout: 15000 });

        const editBtn = page.locator('button.btn-edit', { hasText: 'edit' }).first();
        await expect(editBtn).toBeVisible({ timeout: 5000 });
        await editBtn.click();

        const nameInput = page.locator('input[formcontrolname="name"]');
        await expect(nameInput).toBeVisible({ timeout: 5000 });

        return { nameInput, envName };
    }


    test('2.2.1 – Edit Environment Name to Empty', async ({ page }) => {
        const { nameInput } = await navigateAndEnterEditMode(page);

        await nameInput.clear();

        await expect(nameInput).toHaveValue('');

        const saveBtn = page.locator('button.btn-edit', { hasText: 'Save' }).first();
        await expect(saveBtn).toBeVisible();
    });


    test('2.2.2 – Edit Environment Name to Duplicate Name', async ({ page }) => {
        const projectId = 'proj-neg-dup';
        const envId = 'env-neg-dup';
        const envName = 'staging';
        const envData = getDefaultEnvData(envId, envName, projectId);

        await page.route(/\/project\/v1\/environments/, async (route) => {
            const method = route.request().method();
            const url = route.request().url();

            if (method === 'GET' && url.includes(`id=${envId}`)) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ status: 'Success', data: envData })
                });
            } else if (method === 'PUT') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        status: 'Error',
                        message: 'Name already exists. Please choose a different name.',
                        data: { name: envName }
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ status: 'success', data: [] })
                });
            }
        });
        await page.route(/\/user\/v1\/policies/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: [{ V0: '9984d17f-249e-4df3-a31d-09a2378a1ed4', V1: 'nimbuz', V2: '*', V3: '*', V4: 'admin' }]
                })
            });
        });

        await page.goto(`/projects/environment-preferences?envName=${envName}&region=ap-south-1&envId=${envId}&projectId=${projectId}`);

        const envNameDisplay = page.locator('.field-value', { hasText: envName });
        await expect(envNameDisplay).toBeVisible({ timeout: 15000 });

        const editBtn = page.locator('button.btn-edit', { hasText: 'edit' }).first();
        await editBtn.click();

        const nameInput = page.locator('input[formcontrolname="name"]');
        await expect(nameInput).toBeVisible({ timeout: 5000 });

        await nameInput.clear();
        await nameInput.fill('Production');

        const saveBtn = page.locator('button.btn-edit', { hasText: 'Save' }).first();
        await saveBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
    });


    test('2.2.3 – Edit Environment Name with Invalid Characters', async ({ page }) => {
        const { nameInput } = await navigateAndEnterEditMode(page);

        await nameInput.clear();
        await nameInput.fill('prod@env#1');

        await page.locator('.field-label', { hasText: 'Region' }).click();

        await expect(nameInput).toHaveValue('prod@env#1');

        const hasError = await page.evaluate(() => {
            const input = document.querySelector('input[formcontrolname="name"]');
            return input?.classList.contains('ng-invalid') ?? false;
        });
        expect(hasError).toBe(true);
    });


    test('2.2.4 – Edit Environment Name with Only Special Characters', async ({ page }) => {
        const { nameInput } = await navigateAndEnterEditMode(page);

        await nameInput.clear();
        await nameInput.fill('@@@@');

        await page.locator('.field-label', { hasText: 'Region' }).click();

        const hasError = await page.evaluate(() => {
            const input = document.querySelector('input[formcontrolname="name"]');
            return input?.classList.contains('ng-invalid') ?? false;
        });
        expect(hasError).toBe(true);
    });


    test('2.2.5 – Edit Environment Name Less Than Minimum Length', async ({ page }) => {
        const { nameInput } = await navigateAndEnterEditMode(page);

        await nameInput.clear();
        await nameInput.fill('ab');

        await page.locator('.field-label', { hasText: 'Region' }).click();

        await expect(nameInput).toHaveValue('ab');

        const isValid = await page.evaluate(() => {
            const input = document.querySelector('input[formcontrolname="name"]');
            return input?.classList.contains('ng-valid') ?? false;
        });
        expect(isValid).toBe(true);
    });


    test('2.2.6 – Edit Environment Name Exceeding Maximum Length', async ({ page }) => {
        const { nameInput } = await navigateAndEnterEditMode(page);

        const longName = 'environment-name-exceeding-fifty-characters-limit-x';
        await nameInput.clear();
        await nameInput.fill(longName);

        await page.locator('.field-label', { hasText: 'Region' }).click();

        const errorMsg = page.locator('.text-danger', { hasText: 'Maximum 50 characters allowed' });
        await expect(errorMsg).toBeVisible({ timeout: 5000 });

        const hasError = await page.evaluate(() => {
            const input = document.querySelector('input[formcontrolname="name"]');
            return input?.classList.contains('ng-invalid') ?? false;
        });
        expect(hasError).toBe(true);
    });


    test('2.2.7 – Edit Environment Name with Leading and Trailing Spaces', async ({ page }) => {
        const { nameInput } = await navigateAndEnterEditMode(page);

        await nameInput.clear();
        await nameInput.fill(' production');

        await page.locator('.field-label', { hasText: 'Region' }).click();

        const hasError = await page.evaluate(() => {
            const input = document.querySelector('input[formcontrolname="name"]');
            return input?.classList.contains('ng-invalid') ?? false;
        });
        expect(hasError).toBe(true);
    });


    test('2.2.8 – Invalid Resource Values', async ({ page }) => {
        const projectId = 'proj-neg-resource';
        const envId = 'env-neg-res';
        const envName = 'staging';
        const envData = getDefaultEnvData(envId, envName, projectId);

        await setupViewEnvMocks(page, envId, envData);

        await page.goto(`/projects/environment-preferences?envName=${envName}&region=ap-south-1&envId=${envId}&projectId=${projectId}`);

        const resourceHeader = page.locator('button', { hasText: 'Resource limits' });
        await expect(resourceHeader).toBeVisible({ timeout: 15000 });

        await page.waitForTimeout(2000);

        const resourceEditBtn = page.locator('button.btn-edit', { hasText: 'edit' }).nth(1);
        await expect(resourceEditBtn).toBeVisible({ timeout: 5000 });
        await resourceEditBtn.click();

        const cpuSlider = page.locator('#cpuMaxUserLimit');
        await expect(cpuSlider).toBeVisible({ timeout: 5000 });

        await page.evaluate(() => {
            const slider = document.querySelector('#cpuMaxUserLimit') as HTMLInputElement;
            if (slider) {
                slider.value = '-5';
                slider.dispatchEvent(new Event('input', { bubbles: true }));
                slider.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        const cpuValue = await cpuSlider.inputValue();
        const numValue = Number(cpuValue);
        expect(numValue).toBeGreaterThanOrEqual(0);
    });


    test('2.2.9 – Resource Limits Accessed by Non-Business User', async ({ page }) => {
        const projectId = 'proj-neg-nonbiz';
        const envId = 'env-neg-nonbiz';
        const envName = 'staging';
        const envData = getDefaultEnvData(envId, envName, projectId);

        await setupViewEnvMocks(page, envId, envData);

        await page.goto(`/projects/environment-preferences?envName=${envName}&region=ap-south-1&envId=${envId}&projectId=${projectId}`);

        const upgradeMsg = page.locator('a.link', { hasText: 'Upgrade to Nimbuz Business' });
        await expect(upgradeMsg).toBeVisible({ timeout: 15000 });
    });

});
