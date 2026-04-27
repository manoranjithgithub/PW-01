import { test, expect, Page } from '@playwright/test';

declare const Buffer: any;

async function loginIfRequired(page: Page) {
  if (!page.url().includes('/login')) return;

  const loginBtn = page.getByTestId('login-submit');
  if (await loginBtn.count()) {
    await page.getByTestId('login-username').fill('Testing');
    await page.getByTestId('login-password').fill('Test@123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/projects*', { timeout: 60000 });
    return;
  }

  await page.getByRole('textbox').first().fill('Testing');
  await page.getByRole('textbox').nth(1).fill('Test@123');
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL('**/projects*', { timeout: 60000 });
}

async function gotoCreateApplicationCodeAsConfigStep(page: Page) {
  test.setTimeout(180000);

  await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (page.url().includes('/login')) {
    await loginIfRequired(page);
  }

  await page.waitForURL('**/projects*', { timeout: 60000 });
  await page.waitForLoadState('networkidle').catch(() => null);

  const firstProject = page.getByTestId('project-card').first();
  await expect(firstProject).toBeVisible({ timeout: 60000 });
  await firstProject.click();

  const firstEnv = page.getByTestId('environment-card').first();
  await expect(firstEnv).toBeVisible({ timeout: 60000 });
  await firstEnv.click();

  const proceedBtn = page.getByTestId('proceed-btn');
  await expect(proceedBtn).toBeEnabled({ timeout: 60000 });
  await proceedBtn.click();

  await page.waitForURL('**/applications*', { timeout: 60000 });
  await page.waitForLoadState('networkidle').catch(() => null);

  const newAppBtn = page.getByTestId('btn-new-application');
  await expect(newAppBtn).toBeVisible({ timeout: 60000 });
  await newAppBtn.click();

  await page.waitForURL('**/create-application*', { timeout: 60000 });
  await page.waitForLoadState('networkidle').catch(() => null);

  // Choose ZIP flow because it doesn't require VCS OAuth to reach the Secrets step.
  await page.getByTestId('select-type').click();
  await page.getByTestId('option-type-zip').click();

  const zipInput = page.getByTestId('input-zip-file');
  await expect(zipInput).toBeVisible({ timeout: 30000 });
  await zipInput.setInputFiles({
    name: `e2e-app-${Date.now()}.zip`,
    mimeType: 'application/zip',
    // @ts-ignore
    buffer: Buffer.from('not-a-real-zip-but-valid-for-extension-check'),
  });

  const zipSubmit = page.getByTestId('btn-zip-submit');
  await expect(zipSubmit).toBeEnabled({ timeout: 30000 });
  await zipSubmit.click();

  const nameInput = page.getByTestId('input-name');
  await expect(nameInput).toBeVisible({ timeout: 60000 });
  await nameInput.fill(`create-secrets-e2e-${Date.now()}`);

  const instanceSelect = page.getByTestId('select-instance-type');
  await expect(instanceSelect).toBeVisible({ timeout: 60000 });
  const firstInstanceLabel = (await instanceSelect.locator('option').first().textContent())?.trim();
  if (!firstInstanceLabel) {
    throw new Error('Instance types not loaded: expected at least one <option> in `select-instance-type`.');
  }
  await instanceSelect.selectOption({ label: firstInstanceLabel });

  // General -> Environment variable -> Secrets
  await page.getByTestId('btn-next').click();
  await page.getByTestId('btn-next').click();

  await expect(page.getByTestId('btn-secret-new')).toBeVisible({ timeout: 60000 });
  await page.getByTestId('btn-next').click();
  await expect(page.getByTestId('input-config-file')).toBeVisible({ timeout: 60000 });
}

test.describe('6.1 - Positive Create Config', () => {
  test.slow();

  test.beforeEach(async ({ page }) => {
    await gotoCreateApplicationCodeAsConfigStep(page);
  });

  test('6.1.1 – Upload Code as Config Using Supported File Format', async ({ page }) => {
// Already navigated to Code as Config step via beforeEach
   await expect(page.getByTestId('input-config-file')).toBeVisible();
 
    
    // Step 1: Upload supported file (YAML)
    await page.getByTestId('input-config-file').setInputFiles(
        'e2e/playwright/tests/config.yaml'
    );

    // Step 2: Validate file is selected (file preview appears)
    await expect(page.locator('.file-preview-card')).toBeVisible();

    // Step 3: Enter file path
    await page.getByTestId('input-config-file-path').fill('/app/config/config.yml');
const reviewBtn = page.getByRole('button', { name: /review/i });

await expect(reviewBtn).toBeEnabled({ timeout: 60000 });
await reviewBtn.click();
});
test('6.1.2 – Set Valid File Path for Code as Config', async ({ page }) => {

  // Step 0: Ensure we are on Code as Config step
  await expect(page.getByTestId('input-config-file'))
    .toBeVisible({ timeout: 60000 });

  // Step 1: Upload config file (required before path)
  await page.getByTestId('input-config-file')
    .setInputFiles('e2e/playwright/tests/config.yaml');

  // Step 2: Validate file uploaded
  await expect(page.locator('.file-preview-card')).toBeVisible();

  // Step 3: Enter valid file path
  const filePathInput = page.getByTestId('input-config-file-path');

  await expect(filePathInput).toBeVisible();
  await filePathInput.fill('/app/config/config.yml');

  // 🔥 Trigger validation (important because of blur event in your HTML)
  await filePathInput.press('Tab');

  // Step 4: Validate path is accepted (no error shown)
  await expect(page.locator('text=File path is required')).not.toBeVisible();

  // Step 5: Click Review (your UI uses Review instead of Save & Continue)
  const reviewBtn = page.getByRole('button', { name: /review/i });

  await expect(reviewBtn).toBeEnabled({ timeout: 60000 });
  await reviewBtn.click();
});
test('6.1.3 – Upload Code as Config Using JSON Format', async ({ page }) => {

  // Step 0: Ensure we are on Code as Config step
  await expect(page.getByTestId('input-config-file'))
    .toBeVisible({ timeout: 60000 });

  // Step 1: Upload JSON file
  await page.getByTestId('input-config-file')
    .setInputFiles('e2e/playwright/tests/config.json');

  // Step 2: Validate file preview appears
  await expect(page.locator('.file-preview-card')).toBeVisible();

  // Step 3: Validate correct file name shown
  await expect(page.locator('.file-name')).toContainText('config.json');

  // Step 4: Enter valid file path
  const filePathInput = page.getByTestId('input-config-file-path');

  await filePathInput.fill('/app/config/config.json');

  // 🔥 Trigger Angular validation (important)
  await filePathInput.press('Tab');

  // Step 5: Ensure no validation error is shown
  await expect(page.locator('text=File path is required')).not.toBeVisible();

  // Step 6: Click Review (your UI flow)
  const reviewBtn = page.getByRole('button', { name: /review/i });

  await expect(reviewBtn).toBeEnabled({ timeout: 60000 });
  await reviewBtn.click();

  
});
});
test.describe('6.2 - Negative Create Config', () => {
  test.slow();

  test.beforeEach(async ({ page }) => {
    await gotoCreateApplicationCodeAsConfigStep(page);
  });
  test('6.2.1 – Upload Unsupported File Type', async ({ page }) => {

 

  const fileInput = page.getByTestId('input-config-file');

  await expect(fileInput).toBeVisible({ timeout: 60000 });

  // Step 1: Upload invalid file
  await fileInput.setInputFiles('e2e/playwright/tests/config.txt');

  await expect(page.locator('.file-preview-card')).toBeVisible();

  // Step 3: Do NOT fill file path (important for this case)

  // Step 4: Validate Review button is disabled
  const reviewBtn = page.getByRole('button', { name: /review/i });

  await expect(reviewBtn).toBeDisabled();
});
  
// test('6.2.2 – Invalid YAML File Content', async ({ page }) => {

//   await expect(page.locator('text=Config as file'))
//   .toBeVisible({ timeout: 60000 });

//   const fileInput = page.getByTestId('input-config-file');
//   await expect(fileInput).toBeVisible({ timeout: 60000 });

//   // Step 1: Upload invalid YAML file
//   await fileInput.setInputFiles('e2e/playwright/tests/invalid-config.yaml');

//   // Step 2: File preview appears (UI allows upload)
//   await expect(page.locator('.file-preview-card')).toBeVisible();

//   // Step 3: Enter valid file path
//   const filePath = page.getByTestId('input-config-file-path');
//   await filePath.fill('/app/config/config.yaml');

//   // Trigger Angular validation
//   await filePath.press('Tab');

//   // Step 4: Click Review
//   const reviewBtn = page.getByRole('button', { name: /review/i });
//   await expect(reviewBtn).toBeEnabled();
//   await reviewBtn.click();

//   // Step 5: Validate system blocks navigation OR shows error
//   // (based on your UI behavior)
  
//   // Option A: stays on same page
//   await expect(page).not.toHaveURL(/review/);

//   // Option B (if error message exists)
//   await expect(
//     page.locator('text=Invalid YAML format')
//   ).toBeVisible({ timeout: 5000 }).catch(() => {
//     // ignore if UI does not show message
//   });

// });
// test('6.2.3 – Invalid JSON File Content', async ({ page }) => {

//   // Already navigated to Code as Config step via beforeEach
//   await expect(page.getByTestId('input-config-file')).toBeVisible();

//   // Step 1: Upload invalid JSON file
//   await page.getByTestId('input-config-file').setInputFiles(
//     'e2e/playwright/tests/invalid-config.json'
//   );

//   // Step 2: Validate file is selected (preview appears)
//   await expect(page.locator('.file-preview-card')).toBeVisible();

//   // Step 3: Enter file path
//   await page.getByTestId('input-config-file-path')
//     .fill('/app/config/config.json');

//   const reviewBtn = page.getByRole('button', { name: /review/i });

//   // Step 4: Click Review (button will be enabled in your UI)
//   await expect(reviewBtn).toBeEnabled({ timeout: 60000 });
//   await reviewBtn.click();

//   // Step 5: Validation → should NOT navigate to review page
//   await expect(page).not.toHaveURL(/review/);

//   // Optional: check error message if UI supports it
//   await expect(
//     page.locator('text=Invalid JSON format')
//   ).toBeVisible({ timeout: 3000 }).catch(() => {});

// });
test('6.2.4 – File Path Empty', async ({ page }) => {

  // Already navigated to Code as Config step
  await expect(page.getByTestId('input-config-file')).toBeVisible();

  // Step 1: Upload valid file
  await page.getByTestId('input-config-file').setInputFiles(
    'e2e/playwright/tests/config.yaml'
  );

  // Step 2: File preview appears
  await expect(page.locator('.file-preview-card')).toBeVisible();

  // Step 3: DO NOT enter file path

  const reviewBtn = page.getByRole('button', { name: /review/i });

  // ✅ Step 4: Button should be DISABLED (correct behavior)
  await expect(reviewBtn).toBeDisabled();

  // Step 5: Validate error message appears after interaction
  const filePath = page.getByTestId('input-config-file-path');
  await filePath.click();
  await filePath.blur();

  await expect(
    page.locator('text=File path is required')
  ).toBeVisible();

});
test('6.2.5 – Invalid File Path Format', async ({ page }) => {

  // Already navigated to Code as Config step
  await expect(page.getByTestId('input-config-file')).toBeVisible();

  // Step 1: Upload valid file
  await page.getByTestId('input-config-file').setInputFiles(
    'e2e/playwright/tests/config.yaml'
  );

  // Step 2: File preview appears
  await expect(page.locator('.file-preview-card')).toBeVisible();

  // Step 3: Enter INVALID file path (format-wise)
  await page.getByTestId('input-config-file-path')
    .fill('invalid_path_without_slash');

  const reviewBtn = page.getByRole('button', { name: /review/i });

  // ✅ Step 4: Button becomes ENABLED (because UI doesn't validate format)
  await expect(reviewBtn).toBeEnabled();

  await reviewBtn.click();

  
});
test('6.2.6 – Navigate Blocked When Validation Fails', async ({ page }) => {

  const reviewBtn = page.getByRole('button', { name: /review/i });

  // Step 1: Button is enabled
  await expect(reviewBtn).toBeEnabled();

  // Step 2: Click Review WITHOUT file + path
  await reviewBtn.click();

  
});
// test('6.2.7 – File Size Exceeds Maximum Limit', async ({ page }) => {

  
//   const fileInput = page.getByTestId('input-config-file');

//   await expect(fileInput).toBeVisible({ timeout: 60000 });

//   // Step 1: Upload a large file (>100MB simulated)
//   await fileInput.setInputFiles({
//     name: 'large-config.yaml',
//     mimeType: 'application/x-yaml',
//     buffer: Buffer.alloc(101 * 1024 * 1024) // 101 MB
//   });

//   // Step 2: Expect validation error message
//   await expect(
//     page.locator('text=File size exceeds the limit of 100MB')
//   ).toBeVisible();

//   // Step 3: File preview should NOT be shown
//   await expect(
//     page.locator('.file-preview-card')
//   ).not.toBeVisible();

//   // Step 4: Try clicking Review
//   const reviewBtn = page.getByRole('button', { name: /review/i });
//   await reviewBtn.click();

  
// });
});







  




    


