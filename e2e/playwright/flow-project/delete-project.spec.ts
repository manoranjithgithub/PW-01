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

async function setupDeleteProjectMocks(
    page: Page,
    projectId: string,
    initialName: string,
    initialDesc: string
) {
    await page.route(/\/project\/v1\/projects/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === 'DELETE' && url.includes(`/projects/${projectId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    message: 'Project deleted successfully.',
                    data: {}
                })
            });
            return;
        }

        if (method === 'GET' && url.includes(`/projects/${projectId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    data: {
                        id: projectId,
                        name: initialName,
                        description: initialDesc,
                        status: 'Active',
                        github: false,
                        gitlab: false
                    }
                })
            });
            return;
        }

        if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: [
                        { id: projectId, name: initialName, status: 'Active' }
                    ]
                })
            });
            return;
        }

        await route.continue();
    });

    await page.route(/\/project\/v1\/environments/, async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: []
                })
            });
        } else {
            await route.continue();
        }
    });

    await page.route(/\/user\/v1\/policies/, async (route) => {
        if (route.request().method() === 'GET') {
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
        } else {
            await route.continue();
        }
    });
}

test.describe('3.1 - Scenarios Delete Project', () => {

    const projectId = 'del-project-id';

    test('3.1.1 – Delete Project from Project Header', async ({ page }) => {
        await setupDeleteProjectMocks(page, projectId, 'del-project', 'Project to delete');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        const headerDropdown = page.locator('.action-dropdown button.btn-icon');
        await expect(headerDropdown).toBeVisible({ timeout: 15000 });
        await headerDropdown.click();

        const deleteOption = page.locator('.dropdown-item', { hasText: 'Delete' });
        await expect(deleteOption).toBeVisible();
        await deleteOption.click();

        await expect(page.locator('h4')).toContainText('Delete');

        const confirmInput = page.locator('input.form-control');
        const confirmButton = page.locator('button', { hasText: 'Confirm' });

        await expect(confirmButton).toBeDisabled();

        await confirmInput.fill('del-project');
        await expect(confirmButton).toBeEnabled();

        await confirmButton.click();

        await expect(page.locator('.toast-message')).toHaveText('Project deleted successfully.');
        await expect(page).toHaveURL(/.*\/projects/);
    });

    test('3.1.2 – Delete Project from Project Settings Page', async ({ page }) => {
        await setupDeleteProjectMocks(page, projectId, 'del-project', 'Project to delete');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        const footerDeleteBtn = page.locator('button.btn-outline-danger', { hasText: 'Delete Project' });
        await footerDeleteBtn.scrollIntoViewIfNeeded();
        await expect(footerDeleteBtn).toBeVisible({ timeout: 15000 });
        await footerDeleteBtn.click();

        await expect(page.locator('h4')).toContainText('Delete');

        const confirmInput = page.locator('input.form-control');
        const confirmButton = page.locator('button', { hasText: 'Confirm' });

        await expect(confirmButton).toBeDisabled();
        await confirmInput.fill('del-project');
        await expect(confirmButton).toBeEnabled();

        await confirmButton.click();

        await expect(page.locator('.toast-message')).toHaveText('Project deleted successfully.');
        await expect(page).toHaveURL(/.*\/projects/);
    });

});
