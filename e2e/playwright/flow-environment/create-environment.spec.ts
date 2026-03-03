import { test, expect, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('accessToken', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Im5pbWJ1ei1jZXJ0IiwidHlwIjoiSldUIn0.eyJvd25lciI6Im5pbWJ1eiIsIm5hbWUiOiJEZXYiLCJjcmVhdGVkVGltZSI6IjIwMjUtMTItMzBUMTM6MDI6MjZaIiwidXBkYXRlZFRpbWUiOiIyMDI1LTEyLTMwVDEzOjA1OjQwWiIsImRlbGV0ZWRUaW1lIjoiIiwiaWQiOiJiODQ0ZmNkYS05ZWJkLTQwOTUtYmYxYy0yZWUwYThiNDA2YTAiLCJ0eXBlIjoiIiwicGFzc3dvcmQiOiIiLCJwYXNzd29yZFNhbHQiOiIiLCJwYXNzd29yZFR5cGUiOiJwbGFpbiIsImRpc3BsYXlOYW1lIjoiRGV2IiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIiLCJhdmF0YXIiOiIiLCJhdmF0YXJUeXBlIjoiIiwicGVybWFuZW50QXZhdGFyIjoiIiwiZW1haWwiOiJtYW5vcmFuaml0aC5wZEBnbWFpbC5jb20iLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwicGhvbmUiOiIiLCJjb3VudHJ5Q29kZSI6IiIsInJlZ2lvbiI6IiIsImxvY2F0aW9uIjoiIiwiYWRkcmVzcyI6W10sImFmZmlsaWF0aW9uIjoiIiwidGl0bGUiOiIiLCJpZENhcmRUeXBlIjoiIiwiaWRDYXJkIjoiIiwiaG9tZXBhZ2UiOiIiLCJiaW8iOiIiLCJsYW5ndWFnZSI6IiIsImdlbmRlciI6IiIsImJpcnRoZGF5IjoiIiwiZWR1Y2F0aW9uIjoiIiwic2NvcmUiOjAsImthcm1hIjowLCJyYW5raW5nIjo1LCJpc0RlZmF1bHRBdmF0YXIiOmZhbHNlLCJpc09ubGluZSI6ZmFsc2UsImlzQWRtaW4iOmZhbHNlLCJpc0ZvcmJpZGRlbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsInNpZ251cEFwcGxpY2F0aW9uIjoibmltYnV6IiwiaGFzaCI6IiIsInByZUhhc2giOiIiLCJhY2Nlc3NLZXkiOiIiLCJhY2Nlc3NTZWNyZXQiOiIiLCJnaXRodWIiOiIiLCJnb29nbGUiOiIiLCJxcSI6IiIsIndlY2hhdCI6IiIsImZhY2Vib29rIjoiIiwiZGluZ3RhbGsiOiIiLCJ3ZWlibyI6IiIsImdpdGVlIjoiIiwibGlua2VkaW4iOiIiLCJ3ZWNvbSI6IiIsImxhcmsiOiIiLCJnaXRsYWIiOiIiLCJjcmVhdGVkSXAiOiIiLCJsYXN0U2lnbmluVGltZSI6IiIsImxhc3RTaWduaW5JcCI6IiIsInByZWZlcnJlZE1mYVR5cGUiOiIiLCJyZWNvdmVyeUNvZGVzIjpudWxsLCJ0b3RwU2VjcmV0IjoiIiwibWZhUGhvbmVFbmFibGVkIjpmYWxzZSwibWZhRW1haWxFbmFibGVkIjpmYWxzZSwibGRhcCI6IiIsInByb3BlcnRpZXMiOnsiYnVzaW5lc3NOYW1lIjoibmltYnV6IiwiaXNWZXJpZmllZCI6InRydWUiLCJuaW1idXpBY2NvdW50SWQiOiJiNjliZjczYi05ZGIwLTQ1M2QtOTZlNS00MzMwYmY2YjNkYzYiLCJuaW1idXpVc2VySWQiOiI5OTg0ZDE3Zi0yNDllLTRkZjMtYTMxZC0wOWEyMzc4YTFlZDQiLCJ0eXBlIjoiaW5kaXZpZHVhbCJ9LCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwiZ3JvdXBzIjpbXSwibGFzdFNpZ25pbldyb25nVGltZSI6IiIsInNpZ25pbldyb25nVGltZXMiOjAsIm1hbmFnZWRBY2NvdW50cyI6bnVsbCwidG9rZW5UeXBlIjoiYWNjZXNzLXRva2VuIiwidGFnIjoiIiwiYXpwIjoibmltYnV6IiwiaXNzIjoiaHR0cHM6Ly9jYXNkb29yLmRldi5uaW1idXoudGVjaCIsInN1YiI6ImI4NDRmY2RhLTllYmQtNDA5NS1iZjFjLTJlZTBhOGI0MDZhMCIsImF1ZCI6WyJuaW1idXoiXSwiZXhwIjoxNzcxMjQzNDcwLCJuYmYiOjE3NzA2Mzg2NzAsImlhdCI6MTc3MDYzODY3MCwianRpIjoiYWRtaW4vMWVmYWJiMjUtOGZmMi00MjhiLWFmNGEtN2UwMWRjZjI4Njg2In0.eq6vS6zRLnNVrG_gzaUTbXlVW1XltwISNnAycwe7ysHRT47KIfVMo7rxHgik44Sp-WiEd_8Sq96KA3NlkVZEbeOqXOEF203Vc25McmGCHJsed8-hm51PK3hJNZJaiQLrV3Y5jprivQcyTWnuN7DtHo0b6cYnErZtstYpwjNu70-AZNv5SiYl2ObgiSihddaoaBl-IVAlX5_RzP8HPqmD3PwHTaDtd8auG01-mkL0fWuIDa24Mads_yvkSvCkLwI7wnovyo09Tcu8njzsH4avGRV73r9akN8xQ0HJ3YuaIvWdOSfvoFMM-KcZiUJMlbfXEAQL6PG2IkkUmCR7WkCP7hFFNEbroNy6FhdyrLoRP0xsWILTDWv6WrJlnyOTA-of-M1GQYOtKcBHjMRbWJ6MWBSYMiMZ_e-wg4oRZUTwgFXCrHUL963kFxDNtyQ_mxayZ43Jmue7McCVp7bZhnV-MEMyQMVAOIqp_9mTpoLCKM5rjYxrHtRiRPoc5vDIxODiu3LG_eB6ItDXPraz5tATe_3BRqNHvu8R7ev4MrPvAD-XFLrCVR_gtzgPe3H4Q0FitEeP75fFk-KAnKD8d8q9gU_nlmx1_HLw-3bTbgTN9W6HTznj34B23XRsN6kj06f1h1cPuo5zNtn6VXKDwCTsHH9TyazhO_H-hmLF_5q5J8I');
            localStorage.setItem('userId', 'test-user');
            localStorage.setItem('accountId', 'test-account');
            const policies = [{ V0: 'test-user', V4: 'ADMIN' }];
            localStorage.setItem('policies', JSON.stringify(policies));
        } catch (e) { }
    });
});


async function setupProjectPageMocks(page: Page, projectName: string, envName: string) {
    const projectId = 'mock-project-id';
    const envId = 'mock-env-id';
    let projectCreated = false;

    await page.route(/\/project\/v1\/projects/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === 'POST') {
            projectCreated = true;
            const requestBody = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    message: 'Project has been created successfully.',
                    data: {
                        id: projectId,
                        name: requestBody.name,
                        envName: requestBody.envName,
                        status: 'Active',
                        environment: { id: envId, name: requestBody.envName, region: requestBody.region || 'ap-south-1' }
                    }
                })
            });
        } else if (method === 'GET' && url.includes(`/projects/${projectId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: { id: projectId, name: projectName, status: 'Active', github: null, gitlab: null }
                })
            });
        } else if (method === 'GET') {
            const data = projectCreated
                ? [{ id: projectId, name: projectName, status: 'Active' }]
                : [];
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data })
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
                    data: projectCreated
                        ? [{ id: envId, name: envName, region: 'ap-south-1', project_id: projectId }]
                        : []
                })
            });
        } else {
            await route.continue();
        }
    });
}


async function setupEnvironmentPageMocks(
    page: Page,
    opts: {
        projectId?: string;
        projectName?: string;
        existingEnvs?: { id: string; name: string; region: string; project_id: string }[];
        newEnvName?: string;
        newEnvRegion?: string;
        projects?: { id: string; name: string; status: string }[];
    }
) {
    const projectId = opts.projectId ?? 'mock-project-id';
    const projectName = opts.projectName ?? 'my-project';
    const existingEnvs = opts.existingEnvs ?? [];
    const newEnvName = opts.newEnvName ?? 'default';
    const newEnvRegion = opts.newEnvRegion ?? 'ap-south-1';
    const newEnvId = 'mock-new-env-id';
    const projects = opts.projects ?? [{ id: projectId, name: projectName, status: 'Active' }];

    let environmentCreated = false;

    await page.addInitScript((data) => {
        localStorage.setItem('project', JSON.stringify({ id: data.projectId, name: data.projectName }));
    }, { projectId, projectName });

    await page.route(/\/project\/v1\/projects/, async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === 'GET' && url.includes(`/projects/${projectId}`)) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: { id: projectId, name: projectName, status: 'Active', github: null, gitlab: null }
                })
            });
        } else if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: projects })
            });
        } else {
            await route.continue();
        }
    });

    await page.route(/\/project\/v1\/environments/, async (route) => {
        const method = route.request().method();

        if (method === 'POST') {
            environmentCreated = true;
            const reqBody = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    message: 'Environment created successfully.',
                    data: {
                        id: newEnvId,
                        name: reqBody.name || newEnvName,
                        region: reqBody.region || newEnvRegion,
                        project_id: reqBody.projectId || projectId
                    }
                })
            });
        } else if (method === 'GET') {
            const envs = environmentCreated
                ? [...existingEnvs, { id: newEnvId, name: newEnvName, region: newEnvRegion, project_id: projectId }]
                : existingEnvs;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'success', data: envs })
            });
        } else {
            await route.continue();
        }
    });

    await page.route(/\/deployment\/v1\/environments\/.*\/resource-quotas\/usage/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [
                    { resource_type: 'projects', remaining: 5 },
                    { resource_type: 'environments', remaining: 10 }
                ]
            })
        });
    });
}


test.describe('1.1 - Positive Create Environment', () => {

    test('1.1.1 – Create Environment with Default Environment (Create Project Page)', async ({ page }) => {
        const projectName = 'env-test-project-01';
        const envName = 'default';

        await setupProjectPageMocks(page, projectName, envName);
        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();
        await expect(environmentNameInput).toHaveValue('default');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);

        await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });


    test('1.1.2 – Create New Environment from Environment Page (Default Name)', async ({ page }) => {
        const projectId = 'mock-project-id';
        const projectName = 'my-project';

        await setupEnvironmentPageMocks(page, {
            projectId,
            projectName,
            existingEnvs: [],
            newEnvName: 'default',
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await expect(envNameInput).toBeVisible();
        await expect(envNameInput).toHaveValue('default');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

        const projectSelect = page.locator('select[formcontrolname="project"]');
        await expect(projectSelect).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.3 – Create Environment While Creating Project (Edit Default Environment)', async ({ page }) => {
        const projectName = 'edit-env-project';
        const customEnvName = 'staging';

        await setupProjectPageMocks(page, projectName, customEnvName);
        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toHaveValue('default');

        await environmentNameInput.clear();
        await environmentNameInput.fill(customEnvName);
        await expect(environmentNameInput).toHaveValue(customEnvName);

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
        await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });


    test('1.1.4 – Create New Environment from Environment Page', async ({ page }) => {
        const projectId = 'mock-project-id';
        const projectName = 'my-project';
        const envName = 'production';

        await setupEnvironmentPageMocks(page, {
            projectId,
            projectName,
            existingEnvs: [{ id: 'env-1', name: 'default', region: 'ap-south-1', project_id: projectId }],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(envName);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createBtn = page.locator('button:has-text("Create Environment")');
        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.5 – Create Environment with Valid Name', async ({ page }) => {
        const envName = 'dev-env';

        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(envName);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeEnabled();

        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.6 – Environment Name with Letters, Numbers, and Hyphens', async ({ page }) => {
        const envName = 'qa-env-01';

        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(envName);

        const projectSelect = page.locator('select[formcontrolname="project"]');
        await projectSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg).not.toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeEnabled();

        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');
    });


    test('1.1.7 – Environment Name with Minimum Length', async ({ page }) => {
        const envName = 'dev';

        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(envName);

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeEnabled();

        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.8 – Environment Name with Maximum Length', async ({ page }) => {
        const envName = 'environment-name-with-maximum-length-40c';

        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(envName);

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeEnabled();

        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.2.9 – Same Environment Name in Different Project', async ({ page }) => {
        const projectAId = 'project-a-id';
        const projectBId = 'project-b-id';
        const envName = 'dev';

        await setupEnvironmentPageMocks(page, {
            projectId: projectBId,
            projectName: 'Project-B',
            existingEnvs: [],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
            projects: [
                { id: projectAId, name: 'Project-A', status: 'Active' },
                { id: projectBId, name: 'Project-B', status: 'Active' },
            ],
        });

        await page.goto('/projects/create-environment');

        const projectSelect = page.locator('select[formcontrolname="project"]');
        await projectSelect.selectOption(projectBId);

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(envName);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeEnabled();

        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.10 – Create Environment with Default Region (Create Project Page)', async ({ page }) => {
        const projectName = 'my-project';
        const envName = 'default';

        await setupProjectPageMocks(page, projectName, envName);
        await page.goto('/projects/create-project');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toHaveValue('default');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.11 – Create Environment with User-Selected Region (Create Project Page)', async ({ page }) => {
        const projectName = 'my-project';
        const envName = 'default';

        await setupProjectPageMocks(page, projectName, envName);
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toHaveValue('default');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.12 – Create Environment with Default Region (Create Environment Page)', async ({ page }) => {
        const envName = 'staging';

        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(envName);

        const createBtn = page.locator('button:has-text("Create Environment")');
        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });


    test('1.1.13 – Create Environment with User-Selected Region (Create Environment Page)', async ({ page }) => {
        const envName = 'default';

        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: envName,
            newEnvRegion: 'ap-south-1',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await expect(envNameInput).toHaveValue('default');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

        const createBtn = page.locator('button:has-text("Create Environment")');
        await createBtn.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Environment created successfully.');

        await expect(page).toHaveURL(/\/projects$/);
    });

});


test.describe('1.2 - Negative Create Environment', () => {

    test('1.2.1 – Environment Name Empty (Create Project Page)', async ({ page }) => {
        await setupProjectPageMocks(page, 'test-project-neg', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('test-project-neg');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await environmentNameInput.clear();

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeEnabled();
    });


    test('1.2.2 – Environment Name with Invalid Characters (Create Project Page) – env@prod', async ({ page }) => {
        await setupProjectPageMocks(page, 'test-project', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('test-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await environmentNameInput.clear();
        await environmentNameInput.fill('env@prod');

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Environment name is invalid' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });


    test('1.2.2b – Environment Name with Invalid Characters (Create Project Page) – my env (space)', async ({ page }) => {
        await setupProjectPageMocks(page, 'test-project', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('test-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await environmentNameInput.clear();
        await environmentNameInput.fill('my env');

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Environment name is invalid' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });


    test('1.2.2c – Environment Name with Invalid Characters (Create Project Page) – env#1', async ({ page }) => {
        await setupProjectPageMocks(page, 'test-project', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('test-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await environmentNameInput.clear();
        await environmentNameInput.fill('env#1');

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Environment name is invalid' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });


    test('1.2.3 – Duplicate Environment Name for Same Project', async ({ page }) => {
        const projectId = 'mock-project-id';

        await setupEnvironmentPageMocks(page, {
            projectId,
            projectName: 'my-project',
            existingEnvs: [
                { id: 'existing-env-1', name: 'production', region: 'ap-south-1', project_id: projectId }
            ],
            newEnvName: 'production',
        });

        await page.goto('/projects/create-environment');

        await page.waitForTimeout(1000);

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill('production');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Name already exists. Please choose a different name.' })).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeDisabled();
    });


    test('1.2.4 – Region Not Selected (Create Project Page – always pre-selected)', async ({ page }) => {
        await setupProjectPageMocks(page, 'test-project', 'default');
        await page.goto('/projects/create-project');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('test-project');

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeEnabled();
    });


    test('1.2.5 – Environment Name Is Empty (Create Environment Page)', async ({ page }) => {
        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: 'default',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'This is a required field' })).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeDisabled();
    });


    test('1.2.6 – Environment Name Less Than 3 Characters', async ({ page }) => {
        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: 'de',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill('de');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name must be at least 3 characters long.' })).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeDisabled();
    });


    test('1.2.7 – Environment Name Exceeds Maximum Length', async ({ page }) => {
        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: 'default',
        });

        await page.goto('/projects/create-environment');

        const longName = 'environment-name-exceeding-maximum-length-limit-allowed';
        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill(longName);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Maximun 40 characters only.' })).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeDisabled();
    });


    test('1.2.8 – Environment Name Contains Special Characters', async ({ page }) => {
        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: 'default',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill('dev_env@123');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Environment name is invalid' })).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeDisabled();
    });


    test('1.2.9 – Environment Name Contains Spaces', async ({ page }) => {
        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: 'default',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill('dev env');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Environment name is invalid' })).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeDisabled();
    });


    test('1.2.10 – Environment Name Provided as Empty String', async ({ page }) => {
        await setupEnvironmentPageMocks(page, {
            existingEnvs: [],
            newEnvName: 'default',
        });

        await page.goto('/projects/create-environment');

        const envNameInput = page.locator('input[formcontrolname="name"]');
        await envNameInput.clear();
        await envNameInput.fill('');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'This is a required field' })).toBeVisible();

        const createBtn = page.locator('button:has-text("Create Environment")');
        await expect(createBtn).toBeDisabled();
    });

});
