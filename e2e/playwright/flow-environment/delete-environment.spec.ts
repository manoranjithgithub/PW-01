import { test, expect, Page } from '@playwright/test';

async function setupLocalStorage(page: Page, projectId: string, envId: string) {
    await page.addInitScript(({ projectId, envId }) => {
        try {
            const user = {
                id: '9984d17f-249e-4df3-a31d-09a2378a1ed4',
                owner: 'nimbuz',
                email: 'test@example.com'
            };

            const policies = [
                { V0: user.id, V1: 'nimbuz', V2: '*', V3: '*', V4: 'admin' }
            ];

            const resourceUsage = [
                { resource_type: 'CPU', unit: 'vCPU' },
                { resource_type: 'RAM', unit: 'gb' },
                { resource_type: 'ephemeral_storage', unit: 'gb' }
            ];

            const project = { id: projectId, name: 'Test Project' };
            const environment = { id: envId, name: 'Test Env' };

            localStorage.setItem('accessToken', 'mock-token');
            localStorage.setItem('userId', user.id);
            localStorage.setItem('accountId', 'test-account');

            localStorage.setItem('policies', JSON.stringify(policies));
            localStorage.setItem('resourceUsage', JSON.stringify(resourceUsage));
            localStorage.setItem('project', JSON.stringify(project));
            localStorage.setItem('environment', JSON.stringify(environment));

            localStorage.setItem('theme-default', 'light');
        } catch (e) { }
    }, { projectId, envId });
}

async function setupMocks(page: Page, projectId: string, envId: string, envName: string) {
    const envData = {
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

    await page.route(/.*\/policies/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [{ V0: '9984d17f-249e-4df3-a31d-09a2378a1ed4', V1: 'nimbuz', V2: '*', V3: '*', V4: 'admin' }]
            })
        });
    });

    await page.route(/.*\/environments(\?.*)?/, async (route) => {
        const url = route.request().url();
        const method = route.request().method();

        if (method === 'DELETE') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    message: 'Environment deleted successfully.'
                })
            });
            return;
        }

        if (url.includes('projectId=')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    data: [envData]
                })
            });
        } else {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'Success', data: envData })
            });
        }
    });

    await page.route(/.*\/resource-quotas\/usage/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'Success',
                data: []
            })
        });
    });

    await page.route(/.*\/projects(\?.*)?/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'Success',
                data: { id: projectId, name: 'Test Project' }
            })
        });
    });
}


test.describe('3. Delete Environment', () => {

    test('3.1.1 – Delete Environment Successfully from Project Settings Page', async ({ page }) => {
        const projectId = 'proj-del-1';
        const envId = 'env-del-1';
        const envName = 'staging';

        await setupLocalStorage(page, projectId, envId);
        await setupMocks(page, projectId, envId, envName);

        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('h2.page-title')).toContainText('Project Preferences');

        const envAccordionBtn = page.locator('button.accordion-button', { hasText: 'Environments' });
        await expect(envAccordionBtn).toBeVisible();

        const isCollapsed = await envAccordionBtn.getAttribute('aria-expanded') === 'false';
        if (isCollapsed) {
            await envAccordionBtn.click();
        }

        const envRow = page.locator('tr').filter({ hasText: envName }).first();
        await expect(envRow).toBeVisible({ timeout: 15000 });

        const dropdownBtn = envRow.locator('.custom-dropdown button');
        await expect(dropdownBtn).toBeVisible();
        await dropdownBtn.click();

        const deleteOption = page.locator('a.custom-dropdown-item', { hasText: 'Delete' });
        await expect(deleteOption).toBeVisible();
        await deleteOption.click();

        const modal = page.locator('app-confirmation-modal');
        await expect(modal).toBeVisible();

        const confirmInput = page.locator('app-confirmation-modal input');
        await confirmInput.fill(envName);

        const confirmBtn = page.locator('app-confirmation-modal button.btn-solid', { hasText: 'Confirm' });
        await expect(confirmBtn).toBeEnabled();
        await confirmBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.toast-message')).toHaveText('Environment deleted successfully.');
    });


    test('3.1.2 – Delete Environment Successfully from Environment Settings Page', async ({ page }) => {
        const projectId = 'proj-del-2';
        const envId = 'env-del-2';
        const envName = 'production';

        await setupLocalStorage(page, projectId, envId);
        await setupMocks(page, projectId, envId, envName);

        const url = `/projects/environment-preferences?envName=${envName}&region=ap-south-1&envId=${envId}&projectId=${projectId}`;
        await page.goto(url);

        await expect(page).toHaveURL(new RegExp(url.replace('?', '\\?')));

        const headerEnvName = page.locator('.selectedItemFromCom');
        await expect(headerEnvName).toContainText(envName, { timeout: 15000 });

        const headerDropdownBtn = page.locator('.action-dropdown button.btn-icon');
        await expect(headerDropdownBtn).toBeVisible();
        await headerDropdownBtn.click();

        const deleteOption = page.locator('.dropdown-item', { hasText: 'Delete' });
        await expect(deleteOption).toBeVisible();
        await deleteOption.click();

        const modal = page.locator('app-confirmation-modal');
        await expect(modal).toBeVisible();

        const confirmInput = page.locator('app-confirmation-modal input');
        await confirmInput.fill(envName);

        const confirmBtn = page.locator('app-confirmation-modal button.btn-solid', { hasText: 'Confirm' });
        await expect(confirmBtn).toBeEnabled();
        await confirmBtn.click();

        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 10000 });

        await expect(page).toHaveURL(/.*\/projects/);
    });

});
