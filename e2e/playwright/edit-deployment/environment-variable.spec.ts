import { test, expect, Page } from '@playwright/test';

async function gotoFirstDeploymentEnvTab(page: Page) {
  test.setTimeout(120000);

  await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });

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
  if ((await projectCards.count()) === 0) {
    throw new Error('No projects found: expected at least one `data-testid="project-card"` on /projects.');
  }
  await projectCards.first().click();

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

  await page.getByText('Environment Variables', { exact: true }).first().click();
  await expect(page.getByTestId('btn-deployment-save-changes')).toBeVisible({ timeout: 20000 });
}

async function addEnvToList(page: Page, name: string, value: string) {
  await page.getByTestId('btn-env-new').click();

  const envNameInput = page.getByTestId('input-env-name');
  await expect(envNameInput).toBeVisible();
  await envNameInput.fill(name);

  const envValueInput = page.getByTestId('input-env-value');
  await expect(envValueInput).toBeVisible();
  await envValueInput.fill(value);

  await page.getByTestId('btn-env-add-to-list').click();

  await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15000 });
}

test.describe('8.1 - Positive Edit Environment Variables', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstDeploymentEnvTab(page);
  });

  test('8.1.1 – Edit Environment Variables After Deployment', async ({ page }) => {
    const varName = 'NODE_ENV';
    const oldValue = 'production';
    const newValue = 'staging';

    await addEnvToList(page, varName, oldValue);

    const envRow = page
      .getByTestId('env-list')
      .locator('[data-testid^="env-row-"]')
      .filter({ hasText: varName });
    await expect(envRow).toBeVisible({ timeout: 15000 });

    await envRow.locator('button[data-testid^="env-action-dropdown-btn-"]').first().click();
    await envRow.locator('[data-testid^="env-action-edit-"]').first().click();

    await page.getByTestId('input-env-value').fill(newValue);
    await page.getByTestId('btn-env-add-to-list').click();

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(
      page.getByText('Environment variables updated successfully').first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('8.1.2 – Add New Environment Variable After Deployment', async ({ page }) => {
    await addEnvToList(page, 'LOG_LEVEL', 'debug');

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(
      page.getByText('Environment variables updated successfully').first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('8.1.3 – Edit Environment Variables Using Raw Editor (.env Format)', async ({ page }) => {

    await page.getByTestId('btn-env-raw-editor').click();

    await page.getByTestId('raw-editor-tab-env').click();
    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();

    await editor.fill('NODE_ENV=production\nPORT=3000\nCACHE_ENABLED=true');
    await page.getByTestId('raw-editor-update').click();

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(
      page.getByText('Environment variables updated successfully').first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('8.1.4 – Edit Environment Variables Using JSON Format', async ({ page }) => {

    await page.getByTestId('btn-env-raw-editor').click();

    await page.getByTestId('raw-editor-tab-json').click();
    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();

    await editor.fill('{\n  "NODE_ENV": "production",\n  "PORT": "3000"\n}');
    await page.getByTestId('raw-editor-update').click();

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(
      page.getByText('Environment variables updated successfully').first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('8.1.5 – Edit Environment Variables and Secrets Together (Multi-Step Flow)', async ({ page }) => {

    await addEnvToList(page, 'MULTI_STEP_VAR', 'multi-value-123');

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(
      page.getByText('Environment variables updated successfully').first()
    ).toBeVisible({ timeout: 20000 });

    await page.getByText('Secrets', { exact: true }).first().click();
    await expect(page.getByTestId('btn-deployment-save-changes')).toBeVisible({ timeout: 20000 });

    await page.getByTestId('btn-secret-new').click();
    const secretNameInput = page.getByTestId('input-secret-name');
    await expect(secretNameInput).toBeVisible();
    await secretNameInput.fill('MULTI_STEP_SECRET');

    const secretValueInput = page.getByTestId('input-secret-value');
    await expect(secretValueInput).toBeVisible();
    await secretValueInput.fill('secret-multi-123');
    await page.getByTestId('btn-secret-add-to-list').click();

    await page.getByTestId('btn-deployment-save-changes').click();
    await expect(
      page.getByText('Secrets updated successfully').first()
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe('8.2 - Negative Edit Environment Variables', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFirstDeploymentEnvTab(page);
  });

  test('8.2.1 – Edit Environment Variables While Application Is Building/Stopped', async ({ page }) => {
    const buildAlert = page.locator('c-alert[color="warning"]', {
      hasText: /building/i,
    });

    if (await buildAlert.isVisible()) {
      const fieldset = page.locator('fieldset[disabled]');
      await expect(fieldset).toBeVisible();

      const saveBtn = page.getByTestId('btn-deployment-save-changes');
      await expect(saveBtn).toBeDisabled();
    } else {
      const stoppedFieldset = page.locator('fieldset[disabled]');
      if (await stoppedFieldset.isVisible()) {
        const saveBtn = page.getByTestId('btn-deployment-save-changes');
        await expect(stoppedFieldset).toBeVisible();
      } else {
        console.log('Application is not in building/stopped state. Skipping disabled-state check.');
      }
    }
  });

  test('8.2.2 – Submit Environment Variables with Empty Name', async ({ page }) => {
    await page.getByTestId('btn-env-new').click();

    await page.getByTestId('input-env-value').fill('production');
    await page.getByTestId('btn-env-add-to-list').click();

    await expect(
      page.locator('small.text-danger', { hasText: /Variable name is required\./ })
    ).toBeVisible();
  });

  test('8.2.3 – Submit Environment Variables with Empty Value', async ({ page }) => {
    const varName = `ENV_EMPTY_VAL_${Date.now()}`;

    await page.getByTestId('btn-env-new').click();

    await page.getByTestId('input-env-name').fill(varName);
    await page.getByTestId('input-env-value').fill('');
    await page.getByTestId('btn-env-add-to-list').click();

    await expect(
      page.getByText('Variable value is required.', { exact: true })
    ).toBeVisible();

    await expect(page.getByText(varName, { exact: true })).toHaveCount(0);
  });

  test('8.2.4 – Invalid Raw Editor Format During Edit (.env)', async ({ page }) => {
    await page.getByTestId('btn-env-raw-editor').click();
    await page.getByTestId('raw-editor-tab-env').click();

    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();

    await editor.fill('NODE_ENV production\nPORT:3000');

    await expect(
      page.locator('small.text-danger', { hasText: /Invalid.*format/i })
    ).toBeVisible();
    await expect(page.getByTestId('raw-editor-update')).toBeDisabled();
  });

  test('8.2.5 – Invalid JSON Format During Edit', async ({ page }) => {
    await page.getByTestId('btn-env-raw-editor').click();
    await page.getByTestId('raw-editor-tab-json').click();

    const editor = page.getByTestId('raw-editor-textarea');
    await expect(editor).toBeVisible();
    await editor.fill('{ "NODE_ENV": "production", }');

    await expect(
      page.locator('small.text-danger', { hasText: /Invalid.*JSON/i })
    ).toBeVisible();
    await expect(page.getByTestId('raw-editor-update')).toBeDisabled();
  });

  test('8.2.6 – Submit With No Changes Made', async ({ page }) => {
    const urlBefore = page.url();

    await page.getByTestId('btn-deployment-save-changes').click();
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(urlBefore);
    await expect(page.getByTestId('btn-deployment-save-changes')).toBeVisible();
  });
});
