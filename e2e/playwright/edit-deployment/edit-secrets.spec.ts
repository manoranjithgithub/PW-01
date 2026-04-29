import { test, expect, Page } from '@playwright/test';

async function gotoFirstDeploymentSecretsTab(page: Page) {
  test.setTimeout(120000);

  await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });

  // If auth session is missing/expired, the app may redirect to login.
  if (page.url().includes('/login')) {
    const loginBtn = page.getByTestId('login-submit');
    if (await loginBtn.count()) {
      await page.getByTestId('login-username').fill('Testing');
      await page.getByTestId('login-password').fill('Test@123');
      await page.getByTestId('login-submit').click();
      await page.waitForURL('**/projects*', { timeout: 30000 });
    }
  }

  await page.waitForURL('**/projects*', { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => null);

  const projectCards = page.getByTestId('project-card');
  await expect(projectCards.first()).toBeVisible({ timeout: 30000 });
  if (await projectCards.count() === 0) {
    throw new Error('No projects found: expected at least one `data-testid="project-card"` on /projects.');
  }
  const firstProject = projectCards.first();
  await firstProject.click();

  const firstEnv = page.getByTestId('environment-card').first();
  await expect(firstEnv).toBeVisible({ timeout: 20000 });
  await firstEnv.click();

  const proceedBtn = page.getByTestId('proceed-btn');
  await expect(proceedBtn).toBeEnabled();
  await proceedBtn.click();

  await page.waitForURL('**/applications*', { timeout: 20000 });
  const firstRow = page.getByTestId('ag-grid-table').locator('.ag-row').first();
  await expect(firstRow).toBeVisible({ timeout: 20000 });

  const nameCell = firstRow.locator('.ag-cell[col-id="name"]');
  await nameCell.click({ force: true });
  try {
    await page.waitForURL(/application-details/, { timeout: 20000 });
  } catch {
    await nameCell.click({ force: true });
    await page.waitForURL(/application-details/, { timeout: 20000 });
  }

  await page.getByText('Secrets', { exact: true }).first().click();
  await expect(page.getByTestId('btn-deployment-save-changes')).toBeVisible({ timeout: 20000 });
}

async function addSecretToList(page: Page, name: string, value: string) {
  await page.getByTestId('btn-secret-new').click();

  const secretNameInput = page.getByTestId('input-secret-name');
  await expect(secretNameInput).toBeVisible();
  await secretNameInput.fill(name);

  const secretValueInput = page.getByTestId('input-secret-value');
  await expect(secretValueInput).toBeVisible();
  await secretValueInput.fill(value);

  await page.getByTestId('btn-secret-add-to-list').click();

  await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 });
}

test.describe('9.1 - Edit Secrets After Deployment', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstDeploymentSecretsTab(page);
  });

  test('9.1.1 – Edit Secret After Deployment', async ({ page }) => {
    const secretName = 'DB_PASSWORD';
    const newValue = 'secret-updated-123';

    await addSecretToList(page, secretName, 'secret-old');

    const secretRow = page
      .getByTestId('secrets-list')
      .locator('[data-testid^="secret-row-"]')
      .filter({ hasText: secretName });
    await expect(secretRow).toBeVisible({ timeout: 15000 });

    await secretRow.locator('button[data-testid^="secret-action-dropdown-btn-"]').first().click();
    await secretRow.locator('[data-testid^="secret-action-edit-"]').first().click();

    await page.getByTestId('input-secret-value').fill(newValue);
    await page.getByTestId('btn-secret-add-to-list').click();

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(page.getByText('Secrets updated successfully').first()).toBeVisible({ timeout: 20000 });
  });

  test('9.1.2 – Add New Secret After Deployment', async ({ page }) => {
    await addSecretToList(page, 'API_KEY', 'api-key-123');

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(page.getByText('Secrets updated successfully').first()).toBeVisible({ timeout: 20000 });
  });

  test('9.1.3 – Edit Secrets Using Raw Editor (.env Format)', async ({ page }) => {
    await page.getByTestId('btn-secret-raw-editor').click();

    await page.getByTestId('raw-editor-tab-env').click();
    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();

    await editor.fill('DB_PASSWORD=secret123\nJWT_SECRET=jwtsecret');
    await page.getByTestId('raw-editor-update').click();

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(page.getByText('Secrets updated successfully').first()).toBeVisible({ timeout: 20000 });
  });

  test('9.1.4 – Edit Secrets Using JSON Format', async ({ page }) => {
    await page.getByTestId('btn-secret-raw-editor').click();

    await page.getByTestId('raw-editor-tab-json').click();
    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();

    await editor.fill('{\n  \"DB_PASSWORD\": \"secret123\",\n  \"JWT_SECRET\": \"jwtsecret\"\n}');
    await page.getByTestId('raw-editor-update').click();

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(page.getByText('Secrets updated successfully').first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('9.2 - Edit Secrets Validation & Restrictions', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstDeploymentSecretsTab(page);
  });
  test('9.2.2 – Submit Secret With Empty Name', async ({ page }) => {
    await page.getByTestId('btn-secret-new').click();

    await page.getByTestId('input-secret-value').fill('secret123');
    await page.getByTestId('btn-secret-add-to-list').click();
    await expect(
      page.locator('small.text-danger', { hasText: /Secret (name|key) is required\./ })
    ).toBeVisible();
  });

  test('9.2.3 – Submit Secret With Empty Value', async ({ page }) => {
    const secretName = `DB_PASSWORD_${Date.now()}`;
    await page.getByTestId('btn-secret-new').click();

    await page.getByTestId('input-secret-name').fill(secretName);
    await page.getByTestId('input-secret-value').fill('');
    await page.getByTestId('btn-secret-add-to-list').click();

    await expect(page.getByText('Secret value is required.', { exact: true })).toBeVisible();
    await expect(page.getByText(secretName, { exact: true })).toHaveCount(0);
  });

  test('9.2.4 – Invalid Raw Editor Format for Secrets', async ({ page }) => {
    await page.getByTestId('btn-secret-raw-editor').click();
    await page.getByTestId('raw-editor-tab-env').click();

    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();

    await editor.fill('DB_PASSWORD secret123\nJWT_SECRET:token');
    await expect(page.locator('small.text-danger', { hasText: /Invalid.*format/i })).toBeVisible();
    await expect(page.getByTestId('raw-editor-update')).toBeDisabled();
  });

  test('9.2.5 – Invalid JSON Format for Secrets', async ({ page }) => {
    await page.getByTestId('btn-secret-raw-editor').click();
    await page.getByTestId('raw-editor-tab-json').click();

    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();

    await editor.fill('{ "DB_PASSWORD": "secret123", }');
    await expect(page.locator('small.text-danger', { hasText: /Invalid.*JSON/i })).toBeVisible();
    await expect(page.getByTestId('raw-editor-update')).toBeDisabled();
  });

  test('9.2.6 – Submit Without Any Changes', async ({ page }) => {
    const urlBefore = page.url();
    await page.getByTestId('btn-deployment-save-changes').click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(urlBefore);
    await expect(page.getByTestId('btn-deployment-save-changes')).toBeVisible();
  });
});
