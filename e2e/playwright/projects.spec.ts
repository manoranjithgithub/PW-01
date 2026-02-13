import { test, expect, Page } from '@playwright/test';

// Auth Setup (runs before each test)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('accessToken', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Im5pbWJ1ei1jZXJ0IiwidHlwIjoiSldUIn0.eyJvd25lciI6Im5pbWJ1eiIsIm5hbWUiOiJEZXYiLCJjcmVhdGVkVGltZSI6IjIwMjUtMTItMzBUMTM6MDI6MjZaIiwidXBkYXRlZFRpbWUiOiIyMDI1LTEyLTMwVDEzOjA1OjQwWiIsImRlbGV0ZWRUaW1lIjoiIiwiaWQiOiJiODQ0ZmNkYS05ZWJkLTQwOTUtYmYxYy0yZWUwYThiNDA2YTAiLCJ0eXBlIjoiIiwicGFzc3dvcmQiOiIiLCJwYXNzd29yZFNhbHQiOiIiLCJwYXNzd29yZFR5cGUiOiJwbGFpbiIsImRpc3BsYXlOYW1lIjoiRGV2IiwiZmlyc3ROYW1lIjoiIiwibGFzdE5hbWUiOiIiLCJhdmF0YXIiOiIiLCJhdmF0YXJUeXBlIjoiIiwicGVybWFuZW50QXZhdGFyIjoiIiwiZW1haWwiOiJtYW5vcmFuaml0aC5wZEBnbWFpbC5jb20iLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwicGhvbmUiOiIiLCJjb3VudHJ5Q29kZSI6IiIsInJlZ2lvbiI6IiIsImxvY2F0aW9uIjoiIiwiYWRkcmVzcyI6W10sImFmZmlsaWF0aW9uIjoiIiwidGl0bGUiOiIiLCJpZENhcmRUeXBlIjoiIiwiaWRDYXJkIjoiIiwiaG9tZXBhZ2UiOiIiLCJiaW8iOiIiLCJsYW5ndWFnZSI6IiIsImdlbmRlciI6IiIsImJpcnRoZGF5IjoiIiwiZWR1Y2F0aW9uIjoiIiwic2NvcmUiOjAsImthcm1hIjowLCJyYW5raW5nIjo1LCJpc0RlZmF1bHRBdmF0YXIiOmZhbHNlLCJpc09ubGluZSI6ZmFsc2UsImlzQWRtaW4iOmZhbHNlLCJpc0ZvcmJpZGRlbiI6ZmFsc2UsImlzRGVsZXRlZCI6ZmFsc2UsInNpZ251cEFwcGxpY2F0aW9uIjoibmltYnV6IiwiaGFzaCI6IiIsInByZUhhc2giOiIiLCJhY2Nlc3NLZXkiOiIiLCJhY2Nlc3NTZWNyZXQiOiIiLCJnaXRodWIiOiIiLCJnb29nbGUiOiIiLCJxcSI6IiIsIndlY2hhdCI6IiIsImZhY2Vib29rIjoiIiwiZGluZ3RhbGsiOiIiLCJ3ZWlibyI6IiIsImdpdGVlIjoiIiwibGlua2VkaW4iOiIiLCJ3ZWNvbSI6IiIsImxhcmsiOiIiLCJnaXRsYWIiOiIiLCJjcmVhdGVkSXAiOiIiLCJsYXN0U2lnbmluVGltZSI6IiIsImxhc3RTaWduaW5JcCI6IiIsInByZWZlcnJlZE1mYVR5cGUiOiIiLCJyZWNvdmVyeUNvZGVzIjpudWxsLCJ0b3RwU2VjcmV0IjoiIiwibWZhUGhvbmVFbmFibGVkIjpmYWxzZSwibWZhRW1haWxFbmFibGVkIjpmYWxzZSwibGRhcCI6IiIsInByb3BlcnRpZXMiOnsiYnVzaW5lc3NOYW1lIjoibmltYnV6IiwiaXNWZXJpZmllZCI6InRydWUiLCJuaW1idXpBY2NvdW50SWQiOiJiNjliZjczYi05ZGIwLTQ1M2QtOTZlNS00MzMwYmY2YjNkYzYiLCJuaW1idXpVc2VySWQiOiI5OTg0ZDE3Zi0yNDllLTRkZjMtYTMxZC0wOWEyMzc4YTFlZDQiLCJ0eXBlIjoiaW5kaXZpZHVhbCJ9LCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwiZ3JvdXBzIjpbXSwibGFzdFNpZ25pbldyb25nVGltZSI6IiIsInNpZ25pbldyb25nVGltZXMiOjAsIm1hbmFnZWRBY2NvdW50cyI6bnVsbCwidG9rZW5UeXBlIjoiYWNjZXNzLXRva2VuIiwidGFnIjoiIiwiYXpwIjoibmltYnV6IiwiaXNzIjoiaHR0cHM6Ly9jYXNkb29yLmRldi5uaW1idXoudGVjaCIsInN1YiI6ImI4NDRmY2RhLTllYmQtNDA5NS1iZjFjLTJlZTBhOGI0MDZhMCIsImF1ZCI6WyJuaW1idXoiXSwiZXhwIjoxNzcxMjQzNDcwLCJuYmYiOjE3NzA2Mzg2NzAsImlhdCI6MTc3MDYzODY3MCwianRpIjoiYWRtaW4vMWVmYWJiMjUtOGZmMi00MjhiLWFmNGEtN2UwMWRjZjI4Njg2In0.eq6vS6zRLnNVrG_gzaUTbXlVW1XltwISNnAycwe7ysHRT47KIfVMo7rxHgik44Sp-WiEd_8Sq96KA3NlkVZEbeOqXOEF203Vc25McmGCHJsed8-hm51PK3hJNZJaiQLrV3Y5jprivQcyTWnuN7DtHo0b6cYnErZtstYpwjNu70-AZNv5SiYl2ObgiSihddaoaBl-IVAlX5_RzP8HPqmD3PwHTaDtd8auG01-mkL0fWuIDa24Mads_yvkSvCkLwI7wnovyo09Tcu8njzsH4avGRV73r9akN8xQ0HJ3YuaIvWdOSfvoFMM-KcZiUJMlbfXEAQL6PG2IkkUmCR7WkCP7hFFNEbroNy6FhdyrLoRP0xsWILTDWv6WrJlnyOTA-of-M1GQYOtKcBHjMRbWJ6MWBSYMiMZ_e-wg4oRZUTwgFXCrHUL963kFxDNtyQ_mxayZ43Jmue7McCVp7bZhnV-MEMyQMVAOIqp_9mTpoLCKM5rjYxrHtRiRPoc5vDIxODiu3LG_eB6ItDXPraz5tATe_3BRqNHvu8R7ev4MrPvAD-XFLrCVR_gtzgPe3H4Q0FitEeP75fFk-KAnKD8d8q9gU_nlmx1_HLw-3bTbgTN9W6HTznj34B23XRsN6kj06f1h1cPuo5zNtn6VXKDwCTsHH9TyazhO_H-hmLF_5q5J8I');
      localStorage.setItem('userId', 'test-user');
      localStorage.setItem('accountId', 'test-account');
      const policies = [{ V0: 'test-user', V4: 'ADMIN' }];
      localStorage.setItem('policies', JSON.stringify(policies));
    } catch (e) {
      // ignore
    }
  });
});


async function setupProjectMocks(page: Page, projectName: string, envName: string) {
  const projectId = 'mock-project-id';
  const envId = 'mock-env-id';
  let projectCreated = false;

  // mock all /project/v1/projects requests
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
      // GET /projects/{id} — project details (called on projects list page)
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
      // GET /projects — list all projects
      // Before creation: return empty list so name validation passes
      // After creation: return the new project so it appears in the list
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

  // Mock ALL /project/v1/environments requests
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



// Test Suite: Project Creation
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

    // Note: Only 'ap-south-1 (Mumbai) - Default' is available in the app
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
    // When project name is empty, the component auto-assigns 'default'
    const autoGeneratedName = 'default';

    await setupProjectMocks(page, autoGeneratedName, envName);

    await page.goto('/projects/create-project');

    const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
    await expect(environmentNameInput).toBeVisible();
    await environmentNameInput.fill(envName);

    // Project Name is left EMPTY
    const projectNameInput = page.locator('input[formcontrolname="projectName"]');
    await expect(projectNameInput).toHaveValue('');

    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.fill('');

    const regionSelect = page.locator('select[formcontrolname="region"]');
    await regionSelect.selectOption('ap-south-1 (Mumbai) - Default');

    const createButton = page.locator('button:has-text("Create project")');
    await createButton.click();

    const toast = page.locator('.toast-success, .ngx-toastr');
    await expect(toast).toContainText('Project has been created successfully.');

    await expect(page).toHaveURL(/\/projects$/);
  });

});



test.describe('Negative Create Project', () => {

  test('1.2.1 – Project Name Below Minimum Length', async ({ page }) => {
    await setupProjectMocks(page, '', 'default');
    await page.goto('/projects/create-project');

    const projectNameInput = page.locator('input[formcontrolname="projectName"]');
    await projectNameInput.fill('ab');

    // Trigger blur/touched state
    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.click();

    // Verify minlength error message
    const errorMsg = page.locator('.text-danger');
    await expect(errorMsg.filter({ hasText: 'Project name must be at least 3 characters long.' })).toBeVisible();

    // Verify Create button is disabled
    const createButton = page.locator('button:has-text("Create project")');
    await expect(createButton).toBeDisabled();
  });



  test('1.2.2 – Project Name Exceeds Maximum Length', async ({ page }) => {
    await setupProjectMocks(page, '', 'default');
    await page.goto('/projects/create-project');

    // 53 characters — exceeds the 50-char limit
    const longName = 'my-project-name-exceeding-fifty-characters-limit-test';
    const projectNameInput = page.locator('input[formcontrolname="projectName"]');
    await projectNameInput.fill(longName);

    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.click();

    // Verify maxlength error message (actual message in the template)
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

    // Touch the field to trigger touched state
    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.click();

    // Verify invalidName error message
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

    // Clear environment name
    const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
    await environmentNameInput.clear();

    // Touch another field
    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.click();

    // The form has no 'required' validator on environmentName.
    // The Create button should still be enabled (form is valid when env is empty)
    const createButton = page.locator('button:has-text("Create project")');
    await expect(createButton).toBeEnabled();
  });


  test('1.2.5 – Environment Name Exceeds Maximum Length', async ({ page }) => {
    await setupProjectMocks(page, '', 'default');
    await page.goto('/projects/create-project');

    const projectNameInput = page.locator('input[formcontrolname="projectName"]');
    await projectNameInput.fill('my-project');

    // 55 characters — exceeds the 50-char limit
    const longEnvName = 'env-name-exceeding-fifty-characters-limit-test-abcdefgh';
    const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
    await environmentNameInput.clear();
    await environmentNameInput.fill(longEnvName);

    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.click();

    // Verify maxlength error
    const errorMsg = page.locator('.text-danger');
    await expect(errorMsg.filter({ hasText: 'Maximun 50 characters only.' })).toBeVisible();

    const createButton = page.locator('button:has-text("Create project")');
    await expect(createButton).toBeDisabled();
  });


  test('1.2.6 – Region Not Selected (default pre-selected)', async ({ page }) => {
    await setupProjectMocks(page, '', 'default');
    await page.goto('/projects/create-project');

    // Verify region always has a default value
    const regionSelect = page.locator('select[formcontrolname="region"]');
    await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');

    // The Create button should be enabled (region always has a value)
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

    // Try to type 260 characters — browser should truncate to 250
    const longDesc = 'A'.repeat(260);
    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.fill(longDesc);

    // Verify the value was truncated to 250 characters by the browser
    const actualValue = await projectDescInput.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(250);
  });


  test('1.2.8 – Empty Payload Submission', async ({ page }) => {
    await setupProjectMocks(page, '', 'default');
    await page.goto('/projects/create-project');

    // Clear all fields
    const projectNameInput = page.locator('input[formcontrolname="projectName"]');
    await projectNameInput.fill('');

    const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
    await environmentNameInput.clear();

    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.fill('');

    // Verify the Create button is disabled (form is invalid)
    const createButton = page.locator('button:has-text("Create project")');

    await projectDescInput.click(); // blur all fields

    await expect(createButton).toBeDisabled();
  });


  test('1.2.9 – Create Project with Only Spaces in Name', async ({ page }) => {
    await setupProjectMocks(page, '', 'default');
    await page.goto('/projects/create-project');

    const projectNameInput = page.locator('input[formcontrolname="projectName"]');
    await projectNameInput.fill('   ');

    // Touch another field to trigger validation display
    const projectDescInput = page.locator('input[formcontrolname="projectDesc"]');
    await projectDescInput.click();

    // Verify whitespace error message
    const errorMsg = page.locator('.text-danger');
    await expect(errorMsg.filter({ hasText: 'Project name cannot be empty.' })).toBeVisible();

    const createButton = page.locator('button:has-text("Create project")');
    await expect(createButton).toBeDisabled();
  });


  test('1.2.10 – Create Project with at Least One Environment', async ({ page }) => {
    await setupProjectMocks(page, '', 'default');
    await page.goto('/projects/create-project');

    // Verify environment section is visible
    const envSection = page.locator('.header-text-format', { hasText: 'Environment' });
    await expect(envSection).toBeVisible();

    // Verify environment name field is pre-filled with 'default'
    const environmentNameInput = page.locator('input[formcontrolname="environmentName"]');
    await expect(environmentNameInput).toBeVisible();
    await expect(environmentNameInput).toHaveValue('default');

    // Verify region dropdown is visible and pre-selected
    const regionSelect = page.locator('select[formcontrolname="region"]');
    await expect(regionSelect).toBeVisible();
    await expect(regionSelect).toHaveValue('ap-south-1 (Mumbai) - Default');
  });

});

