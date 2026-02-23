import { test, expect, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('accessToken', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Im5pbWJ1ei1jZXJ0IiwidHlwIjoiSldUIn0.eyJvd25lciI6Im5pbWJ1eiIsIm5hbWUiOiJEZXZlbG9wbWVudCIsImNyZWF0ZWRUaW1lIjoiMjAyNS0xMi0yOVQxMzo0NTo1N1oiLCJ1cGRhdGVkVGltZSI6IjIwMjYtMDItMTZUMTE6NDc6MTVaIiwiZGVsZXRlZFRpbWUiOiIiLCJpZCI6IjJmOWEyM2IxLTc1ZDAtNGQ2OS05ZWJhLTVmNWVkMDgwZjEyYiIsInR5cGUiOiIiLCJwYXNzd29yZCI6IiIsInBhc3N3b3JkU2FsdCI6IiIsInBhc3N3b3JkVHlwZSI6InBsYWluIiwiZGlzcGxheU5hbWUiOiJEZXZlbG9wbWVudCIsImZpcnN0TmFtZSI6IiIsImxhc3ROYW1lIjoiIiwiYXZhdGFyIjoiIiwiYXZhdGFyVHlwZSI6IiIsInBlcm1hbmVudEF2YXRhciI6IiIsImVtYWlsIjoibWFub3JhbmppdGgubWRAZ21haWwuY29tIiwiZW1haWxWZXJpZmllZCI6ZmFsc2UsInBob25lIjoiIiwiY291bnRyeUNvZGUiOiIiLCJyZWdpb24iOiIiLCJsb2NhdGlvbiI6IiIsImFkZHJlc3MiOltdLCJhZmZpbGlhdGlvbiI6IiIsInRpdGxlIjoiIiwiaWRDYXJkVHlwZSI6IiIsImlkQ2FyZCI6IiIsImhvbWVwYWdlIjoiIiwiYmlvIjoiIiwibGFuZ3VhZ2UiOiIiLCJnZW5kZXIiOiIiLCJiaXJ0aGRheSI6IiIsImVkdWNhdGlvbiI6IiIsInNjb3JlIjowLCJrYXJtYSI6MCwicmFua2luZyI6MiwiaXNEZWZhdWx0QXZhdGFyIjpmYWxzZSwiaXNPbmxpbmUiOmZhbHNlLCJpc0FkbWluIjpmYWxzZSwiaXNGb3JiaWRkZW4iOmZhbHNlLCJpc0RlbGV0ZWQiOmZhbHNlLCJzaWdudXBBcHBsaWNhdGlvbiI6Im5pbWJ1eiIsImhhc2giOiIiLCJwcmVIYXNoIjoiIiwiYWNjZXNzS2V5IjoiIiwiYWNjZXNzU2VjcmV0IjoiIiwiZ2l0aHViIjoiIiwiZ29vZ2xlIjoiIiwicXEiOiIiLCJ3ZWNoYXQiOiIiLCJmYWNlYm9vayI6IiIsImRpbmd0YWxrIjoiIiwid2VpYm8iOiIiLCJnaXRlZSI6IiIsImxpbmtlZGluIjoiIiwid2Vjb20iOiIiLCJsYXJrIjoiIiwiZ2l0bGFiIjoiIiwiY3JlYXRlZElwIjoiIiwibGFzdFNpZ25pblRpbWUiOiIiLCJsYXN0U2lnbmluSXAiOiIiLCJwcmVmZXJyZWRNZmFUeXBlIjoiIiwicmVjb3ZlcnlDb2RlcyI6bnVsbCwidG90cFNlY3JldCI6IiIsIm1mYVBob25lRW5hYmxlZCI6ZmFsc2UsIm1mYUVtYWlsRW5hYmxlZCI6ZmFsc2UsImxkYXAiOiIiLCJwcm9wZXJ0aWVzIjp7ImJ1c2luZXNzTmFtZSI6Im5pbWJ1eiIsImlzVmVyaWZpZWQiOiJ0cnVlIiwibmltYnV6QWNjb3VudElkIjoiZDNiYzMwY2UtODA3MS00NjIyLWE1YmQtMGNkMmU0ZGFlOWYyIiwibmltYnV6VXNlcklkIjoiOWQzMzU3ZGItOWNjYS00NDA3LTljZDctMjA0NmI2OGRmNDU1IiwidHlwZSI6ImluZGl2aWR1YWwifSwicm9sZXMiOltdLCJwZXJtaXNzaW9ucyI6W10sImdyb3VwcyI6W10sImxhc3RTaWduaW5Xcm9uZ1RpbWUiOiIiLCJzaWduaW5Xcm9uZ1RpbWVzIjowLCJtYW5hZ2VkQWNjb3VudHMiOm51bGwsInRva2VuVHlwZSI6ImFjY2Vzcy10b2tlbiIsInRhZyI6IiIsImF6cCI6Im5pbWJ1eiIsImlzcyI6Imh0dHBzOi8vY2FzZG9vci5kZXYubmltYnV6LnRlY2giLCJzdWIiOiIyZjlhMjNiMS03NWQwLTRkNjktOWViYS01ZjVlZDA4MGYxMmIiLCJhdWQiOlsibmltYnV6Il0sImV4cCI6MTc3MjQyMTU1MiwibmJmIjoxNzcxODE2NzUyLCJpYXQiOjE3NzE4MTY3NTIsImp0aSI6ImFkbWluLzdhMTNiNzkzLTlmODEtNDZiMS04NTg3LWIyNDExYmY5MzYwMiJ9.TavgVmMtnHMbnOSjEnAjumCqMdGG68nuS-k4JeXRv8lKLda3awCXkdw4uAtqlwEnIXsLIxJ0GQNrNQ554a9fbX6BcLjgM9HrDdL-HJtffeDHha46boIrALJo-w7pZGcRQ1nv9RT5gRBg80RRmWjq9aMkr2xw1Q6Q0Cjbq4bUNB-2TiXSE1bIrTXOTOuv2pV0m6uOy8F-pxXfkK5SEmsBv_ajCH_EfHOb0M0-67bwvv79SSS3Gi-h9IjOk-59SBCP_BZg0EX8voHem6F_0DYpZ1KOjUdSsYTqYkFiFHO_wsAsprSunzJ34VZm2nAnGlIGXsCUmXIUoAIMDdILE33KsWhwfTptGNNkGBTHmetrqpWz1jrwbE2pg8dx0M7JpHgY0jTBF-AiyBi_Hw7KcaUgzrFfJz4h3vEdG22JeUcw7KJV7XYBr1wUCekINIkHfiNAyr-kgTGCVu1tuIXpOndmDSj6I81Epnc3A3RWVsE07PZJG676j6E4jMlFLWbZO0FidCKCEg6QMGF71b9fBsBEdMuRpKNiTDWxQz0yMp3gRfqiXvoO34szff4oPkOxL76DE0wiqnIi1S3RQydVtlmdLq2YzI_C9HW5QSYGFLW1FhUAc6l3QH7HLV4nvFWSWGaMdzFaoQY6z_0GVYsMrKZ_7H0ZjSgYp7LAL5fT3R7o8to');

            const NIMBUZ_USER_ID = '9d3357db-9cca-4407-9cd7-2046b68df455';
            localStorage.setItem('userId', NIMBUZ_USER_ID);
            localStorage.setItem('accountId', 'd3bc30ce-8071-4622-a5bd-0cd2e4dae9f2');

            const policies = [{ V0: NIMBUZ_USER_ID, V2: '*', V3: '*', V4: 'admin' }];
            localStorage.setItem('policies', JSON.stringify(policies));

            localStorage.setItem('profileSettings', JSON.stringify({
                owner: 'nimbuz',
                name: 'Development',
                email: 'manoranjith.md@gmail.com'
            }));
        } catch (e) { }
    });
});



async function setupProjectMocks(page: Page, projectName: string, envName: string) {
    const projectId = 'mock-project-id';
    const envId = 'mock-env-id';
    let projectCreated = false;

    const NIMBUZ_USER_ID = '9d3357db-9cca-4407-9cd7-2046b68df455';

    await page.route(/\/policies/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'success',
                data: [{ V0: NIMBUZ_USER_ID, V2: '*', V3: '*', V4: 'admin' }]
            })
        });
    });

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
                        environment: { id: envId, name: requestBody.envName, region: 'ap-south-1' }
                    }
                })
            });
        } else if (method === 'GET' && url.includes('/projects/mock-project-id')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'success',
                    data: {
                        id: projectId,
                        name: projectName,
                        status: 'Active',
                        github: null,
                        gitlab: null
                    }
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



test.describe('1.1 - Positive Create Project', () => {

    test('1.1.1 – Create Project with Default Environment', async ({ page }) => {
        const projectName = 'sample-project-01';
        const envName = 'default';

        await setupProjectMocks(page, projectName, envName);

        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();
        await environmentNameInput.fill(envName);

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.fill('');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);

        await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });



    test('1.1.2 – Create Project with Custom Environment Name', async ({ page }) => {
        const projectName = 'custom-env-project';
        const envName = 'staging';

        await setupProjectMocks(page, projectName, envName);

        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();
        await environmentNameInput.clear();
        await environmentNameInput.fill(envName);

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.fill('');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);

        await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });


    test('1.1.3 – Create Project with Description', async ({ page }) => {
        const projectName = 'project-with-desc';
        const envName = 'dev';
        const description = 'This project is used for testing application deployment.';

        await setupProjectMocks(page, projectName, envName);

        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();
        await environmentNameInput.clear();
        await environmentNameInput.fill(envName);

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.fill(description);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);

        await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });


    test('1.1.4 – Create Project Without Description', async ({ page }) => {
        const projectName = 'no-desc-project';
        const envName = 'dev';

        await setupProjectMocks(page, projectName, envName);

        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();
        await environmentNameInput.clear();
        await environmentNameInput.fill(envName);

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.fill('');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);

        await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });



    test('1.1.5 – Create Project by Selecting a Region', async ({ page }) => {
        const projectName = 'region-specific-project';
        const envName = 'dev';
        const description = 'Project deployed in selected region';

        await setupProjectMocks(page, projectName, envName);

        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();
        await environmentNameInput.clear();
        await environmentNameInput.fill(envName);

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(projectName);

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.fill(description);

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

        const createButton = page.locator('button:has-text("Create project")');
        await createButton.click();

        const toast = page.locator('.toast-success, .ngx-toastr');
        await expect(toast).toContainText('Project has been created successfully.');

        await expect(page).toHaveURL(/\/projects$/);

        await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
    });


    test('1.1.6 – Create Project Without Providing Project Name', async ({ page }) => {
        const envName = 'default';

        await setupProjectMocks(page, 'default', envName);

        await page.goto('/projects/create-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await expect(projectNameInput).toHaveValue('');

        await projectNameInput.click();
        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name is required.' })).toBeVisible();
    });

});



test.describe('Negative Create Project', () => {

    test('1.2.1 – Project Name Below Minimum Length', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('ab');

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name must be at least 3 characters long.' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });



    test('1.2.2 – Project Name Exceeds Maximum Length', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const longName = 'my-project-name-exceeding-fifty-characters-limit-test';
        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill(longName);

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Maximun 50 characters only.' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });


    test('1.2.3 – Project Name Contains Invalid Characters', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('my@project#1');

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name can only contain alphabets, numbers and hyphens' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });


    test('1.2.4 – Environment Name Missing', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('my-project');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await environmentNameInput.clear();

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeEnabled();
    });


    test('1.2.5 – Environment Name Exceeds Maximum Length', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('my-project');

        const longEnvName = 'env-name-exceeding-fifty-characters-limit-test-abcdefgh';
        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await environmentNameInput.clear();
        await environmentNameInput.fill(longEnvName);

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Maximun 50 characters only.' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });


    test('1.2.6 – Region Not Selected (default pre-selected)', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('my-project');

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeEnabled();
    });


    test('1.2.7 – Description Exceeds Maximum Length', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('my-project');

        const longDesc = 'A'.repeat(260);
        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.fill(longDesc);

        const actualValue = await projectDescInput.inputValue();
        expect(actualValue.length).toBeLessThanOrEqual(250);
    });


    test('1.2.8 – Empty Payload Submission', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('');

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await environmentNameInput.clear();

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.fill('');

        const createButton = page.locator('button:has-text("Create project")');

        await projectDescInput.click();

        await expect(createButton).toBeDisabled();
    });


    test('1.2.9 – Create Project with Only Spaces in Name', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const projectNameInput = page.locator('input[formcontrolname="projectName"]');
        await projectNameInput.fill('   ');

        const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
        await projectDescInput.click();

        const errorMsg = page.locator('.text-danger');
        await expect(errorMsg.filter({ hasText: 'Project name cannot be empty.' })).toBeVisible();

        const createButton = page.locator('button:has-text("Create project")');
        await expect(createButton).toBeDisabled();
    });


    test('1.2.10 – Create Project with at Least One Environment', async ({ page }) => {
        await setupProjectMocks(page, '', 'default');
        await page.goto('/projects/create-project');

        const envSection = page.locator('.header-text-format', { hasText: 'Environment' });
        await expect(envSection).toBeVisible();

        const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
        await expect(environmentNameInput).toBeVisible();
        await expect(environmentNameInput).toHaveValue('default');

        const regionSelect = page.locator('select[formcontrolname="region"]');
        await expect(regionSelect).toBeVisible();
        await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');
    });

});
