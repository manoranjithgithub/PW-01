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


async function setupEditProjectMocks(
    page: Page,
    projectId: string,
    initialName: string,
    initialDesc: string,
    envName: string = 'default'
) {
    const envId = 'mock-env-id';

    let currentName = initialName;
    let currentDesc = initialDesc;

    await page.route(/\/project\/v1\/projects/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === 'PATCH' && url.includes(`/projects/${projectId}`)) {
            const body = route.request().postDataJSON();
            currentName = body.name ?? currentName;
            currentDesc = body.description ?? currentDesc;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    message: 'Updated Successfully',
                    data: { id: projectId, name: currentName, description: currentDesc, status: 'Active' }
                })
            });
        } else if (method === 'GET' && url.includes(`/projects/${projectId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    data: {
                        id: projectId,
                        name: currentName,
                        description: currentDesc,
                        status: 'Active',
                        github: false,
                        gitlab: false
                    }
                })
            });
        } else if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: [
                        { id: projectId, name: currentName, status: 'Active' }
                    ]
                })
            });
        } else {
            await route.continue();
        }
    });

    await page.route(/\/project\/v1\/environments/, async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: [
                        { id: envId, name: envName, region: 'ap-south-1', project_id: projectId }
                    ]
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


test.describe('Positive Edit Project', () => {

    const projectId = 'edit-project-id';

    test('2.1.1 – Edit Project Name and Description Successfully', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');

        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('.field-value', { hasText: 'old-project' })).toBeVisible();

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await expect(projectNameInput).toBeVisible();
        await projectNameInput.clear();
        await projectNameInput.fill('updated-project');

        const descInput = page.locator('textarea[formcontrolname="description"]');
        await descInput.clear();
        await descInput.fill('Updated project description');

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await saveButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Updated Successfully');
    });


    test('2.1.2 – Valid Project Name Length (Minimum 3 Characters)', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', '');

        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('.field-value', { hasText: 'old-project' })).toBeVisible();

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.clear();
        await projectNameInput.fill('abc');

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Updated Successfully');
    });


    test('2.1.3 – Valid Project Name Length (Maximum Allowed)', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', '');

        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('.field-value', { hasText: 'old-project' })).toBeVisible();

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await editButton.click();

        const maxName = 'a'.repeat(40);
        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.clear();
        await projectNameInput.fill(maxName);

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Updated Successfully');
    });


    test('2.1.4 – Valid Project Name Format (Letters, Numbers, Hyphens Only)', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', '');

        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('.field-value', { hasText: 'old-project' })).toBeVisible();

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.clear();
        await projectNameInput.fill('Project-123');

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Updated Successfully');
    });


    test('2.1.5 – Project Name Provided (Required Field Validation)', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', '');

        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('.field-value', { hasText: 'old-project' })).toBeVisible();

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.clear();
        await projectNameInput.fill('MyProject');

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Updated Successfully');
    });


    test('2.1.6 – Valid Description Length and Empty Description Allowed', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');

        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('.field-value', { hasText: 'old-project' })).toBeVisible();

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await editButton.click();

        const descInput = page.locator('textarea[formcontrolname="description"]');
        await descInput.clear();

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Updated Successfully');
    });

});

test.describe('2.2 - Negative Edit Project', () => {
    const projectId = 'edit-project-id-neg';

    test('2.2.1   Project Name Below Minimum Length', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        await expect(page.locator('.field-value', { hasText: 'old-project' })).toBeVisible();

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await expect(editButton).toBeEnabled();
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('ab');

        const descInput = page.locator('textarea[formcontrolname="description"]');
        await descInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name should have a minimum length of 3.' })).toBeVisible();

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeDisabled();
    });

    test('2.2.2   Project Name Exceeds Maximum Length', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await expect(editButton).toBeEnabled();
        await editButton.click();

        const longName = 'project-name-exceeding-fifty-characters-limit-test1';
        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(longName);

        const descInput = page.locator('textarea[formcontrolname="description"]');
        await descInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name should have a maximum length of 50.' })).toBeVisible();

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeDisabled();
    });

    test('2.2.3   Project Name Contains Invalid Characters', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await expect(editButton).toBeEnabled();
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('my@project#1');

        const descInput = page.locator('textarea[formcontrolname="description"]');
        await descInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name can only contain alphabets, numbers, and hyphens (-).' })).toBeVisible();

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeDisabled();
    });

    test('2.2.4   Project Name Empty', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await expect(editButton).toBeEnabled();
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.clear();

        const descInput = page.locator('textarea[formcontrolname="description"]');
        await descInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name cannot be empty.' })).toBeVisible();

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeDisabled();
    });

    test('2.2.5   Description Exceeds Maximum Length', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await expect(editButton).toBeEnabled();
        await editButton.click();

        const descInput = page.locator('textarea[formcontrolname="description"]');
        const longDesc = 'a'.repeat(201);
        await descInput.fill(longDesc);

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Description should have a maximum length of 200.' })).toBeVisible();

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeDisabled();
    });

    test('2.2.6   Empty Payload Submission', async ({ page }) => {
        await setupEditProjectMocks(page, projectId, 'old-project', 'Old description');
        await page.goto(`/projects/project-preferences?projectId=${projectId}`);

        const editButton = page.locator('button.btn-edit', { hasText: 'edit' });
        await expect(editButton).toBeEnabled();
        await editButton.click();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.clear();

        const descInput = page.locator('textarea[formcontrolname="description"]');
        await descInput.clear();

        await descInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name cannot be empty.' })).toBeVisible();

        const saveButton = page.locator('button.btn-edit', { hasText: 'Save' });
        await expect(saveButton).toBeDisabled();
    });

});

async function setupDeleteProjectMocks(
    page: Page,
    projectId: string,
    initialName: string,
    initialDesc: string,
    envName: string = 'default'
) {
    const envId = 'mock-env-id';
    let currentName = initialName;
    let currentDesc = initialDesc;

    await page.route(/\/project\/v1\/projects/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === 'PATCH' && url.includes(`/projects/${projectId}`)) {
            const body = route.request().postDataJSON();
            currentName = body.name ?? currentName;
            currentDesc = body.description ?? currentDesc;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    message: 'Updated Successfully',
                    data: { id: projectId, name: currentName, description: currentDesc, status: 'Active' }
                })
            });
        } else if (method === 'GET' && url.includes(`/projects/${projectId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    data: {
                        id: projectId,
                        name: currentName,
                        description: currentDesc,
                        status: 'Active',
                        github: false,
                        gitlab: false
                    }
                })
            });
        } else if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: [
                        { id: projectId, name: currentName, status: 'Active' }
                    ]
                })
            });
        } else if (method === 'DELETE' && url.includes(`/projects/${projectId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'Success',
                    message: 'Project deleted successfully.',
                    data: {}
                })
            });
        } else {
            await route.continue();
        }
    });

    await page.route(/\/project\/v1\/environments/, async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: [
                        { id: envId, name: envName, region: 'ap-south-1', project_id: projectId }
                    ]
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
