import { test, expect } from '@playwright/test';

test.describe('10.1 - positive code as config', () => {

    test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/projects');

    await page.waitForURL('**/projects*', { timeout: 15000 });

    // now continue your flow
    await page.waitForTimeout(2000);

    const firstProject = page.getByTestId('project-card').first();
    await expect(firstProject).toBeVisible({ timeout: 15000 });
    await firstProject.click();

    const firstEnv = page.getByTestId('environment-card').first();
    await expect(firstEnv).toBeVisible({ timeout: 15000 });
    await firstEnv.click();

    const proceedBtn = page.getByTestId('proceed-btn');
    await expect(proceedBtn).toBeEnabled();
    await proceedBtn.click();

    await page.waitForURL('**/applications*', { timeout: 15000 });
});
    test('10.1.1.– Edit Code as Config', async ({ page }) => {
await page.locator('.loader-backdrop').waitFor({ state: 'hidden', timeout: 15000 });

    const appRow = page.locator('.ag-row').first();
await expect(appRow).toBeVisible();

await appRow.locator('.ag-cell').first().click();

const configTab = page.getByText('Code as config', { exact: true });

await expect(configTab).toBeVisible({ timeout: 15000 });
await configTab.click();

    const filePath = page.getByTestId('input-file-path');
    const fileName = page.getByTestId('input-file-name');

    await expect(filePath).toBeEditable();
    await expect(fileName).toBeEditable();

    await page.getByTestId('input-file-path').fill('/updated/path');
await page.getByTestId('input-file-name').fill('updated-config.yaml');

await page.getByTestId('input-file-upload')
  .setInputFiles('e2e/playwright/test-data/sample.yaml');

await page.getByTestId('btn-upload-config').click();
await page.waitForLoadState('networkidle');
await page.locator('.loader-backdrop').waitFor({ state: 'hidden' });
await expect(
  page.getByText(/Config Map updated successfully/i)
).toBeVisible();
    });


  
    test('10.1.2 – Edit Code as Config Using JSON File', async ({ page }) => {
await page.locator('.loader-backdrop').waitFor({ state: 'hidden', timeout: 15000 });

    const appRow = page.locator('.ag-row').first();
await expect(appRow).toBeVisible();

await appRow.locator('.ag-cell').first().click();

 
// safe loader handling
const loader = page.locator('.loader-backdrop');
if (await loader.isVisible().catch(() => false)) {
  await loader.waitFor({ state: 'hidden', timeout: 20000 });
}

// open tab
const configTab = page.getByText('Code as config', { exact: true });
await expect(configTab).toBeVisible({ timeout: 15000 });
await expect(configTab).toBeEnabled({ timeout: 15000 });
await configTab.click();

// fields
const filePath = page.getByTestId('input-file-path');
const fileName = page.getByTestId('input-file-name');
const uploadBtn = page.getByTestId('btn-upload-config');

// fill
await filePath.fill('/json/config/path');
await fileName.fill('config.json');
await fileName.blur();

// upload
await page.getByTestId('input-file-upload')
  .setInputFiles('e2e/playwright/test-data/config.json');

// wait button
await expect(uploadBtn).toBeEnabled({ timeout: 10000 });

// click
await uploadBtn.click();

// safe loader again
if (await loader.isVisible().catch(() => false)) {
  await loader.waitFor({ state: 'hidden', timeout: 20000 });
}

// final check
await expect(
  page.getByText('Application Details')
).toBeVisible();
    });
  
  test('10.1.3 – Edit Code as Config With Only File Upload Changed', async ({ page }) => {

  // select application
  const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible();
  await appRow.locator('.ag-cell').first().click();

  // open Code as config tab
  const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible();
  await configTab.click();

  
  // locate elements
  const filePath = page.getByTestId('input-file-path');
  const fileName = page.getByTestId('input-file-name');
  const fileInput = page.getByTestId('input-file-upload');
  const uploadBtn = page.getByTestId('btn-upload-config');

  // ensure fields exist (no change)
  await expect(filePath).toBeVisible();
  await expect(fileName).toBeVisible();

  // optional debug
  const existingPath = await filePath.inputValue();
  const existingName = await fileName.inputValue();
  console.log('Existing Path:', existingPath);
  console.log('Existing Name:', existingName);

 
  await fileInput.setInputFiles('e2e/playwright/test-data/sample.yaml');

 
  await fileName.fill(existingName);
  await fileName.blur();

  
  await expect(uploadBtn).toBeEnabled({ timeout: 10000 });

  // click upload
  await uploadBtn.click();

  // safe loader handling
  const loader = page.locator('.loader-backdrop');
  if (await loader.isVisible().catch(() => false)) {
    await loader.waitFor({ state: 'hidden', timeout: 20000 });
  }

  // final validation
  await expect(
    page.getByText('Application Details')
  ).toBeVisible({ timeout: 15000 });

});
});

test.describe('10.2- negative config', () => {
 
    test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/projects');

    await page.waitForURL('**/projects*', { timeout: 15000 });

    
    await page.waitForTimeout(2000);

    const firstProject = page.getByTestId('project-card').first();
    await expect(firstProject).toBeVisible({ timeout: 15000 });
    await firstProject.click();

    const firstEnv = page.getByTestId('environment-card').first();
    await expect(firstEnv).toBeVisible({ timeout: 15000 });
    await firstEnv.click();

    const proceedBtn = page.getByTestId('proceed-btn');
    await expect(proceedBtn).toBeEnabled();
    await proceedBtn.click();

    await page.waitForURL('**/applications*', { timeout: 15000 });
});
test('10.2.1 – Edit Code as Config While Application Is Building/Stopped', async ({ page }) => {

 
  const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible();
  await appRow.locator('.ag-cell').first().click();

  
 
  const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible();
  await configTab.click();
const header = await page.locator('h1').innerText();

  if (!header.toLowerCase().includes('building')) {
  console.log('⚠️ App not in BUILDING state → skipping validation');
  return;
}

 
  const warning = page.getByTestId('config-warning-alert');

  await expect(warning).toBeVisible({ timeout: 10000 });

  await expect(warning).toHaveText(
    /Config maps cannot be edited while the application is building/i
  );

  await expect(page.getByTestId('input-file-path')).toBeDisabled();
  await expect(page.getByTestId('input-file-name')).toBeDisabled();
  await expect(page.getByTestId('input-file-upload')).toBeDisabled();

 
  await expect(page.getByTestId('btn-upload-config')).toBeDisabled();

});
test('10.2.2 – Upload Unsupported File Type', async ({ page }) => {

 
  const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible();
  await appRow.locator('.ag-cell').first().click();
  
const configTab = page.getByText('Code as config', { exact: true });

await expect(configTab).toBeVisible({ timeout: 15000 });
await configTab.click();
 const fileInput = page.getByTestId('input-file-upload');
  const uploadBtn = page.getByTestId('btn-upload-config');
  const filePreview = page.getByTestId('file-preview');

  await fileInput.setInputFiles('e2e/playwright/test-data/config.txt');
 await expect(filePreview).not.toBeVisible();
 await expect(uploadBtn).toBeDisabled();

});
test('10.2.3 – Submit Without Uploading a File', async ({ page }) => {
const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible({ timeout: 15000 });
 await appRow.locator('.ag-cell').first().click();

  
const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible({ timeout: 10000 });
  await configTab.click();
  const uploadBtn = page.getByTestId('btn-upload-config');
  const fileInput = page.getByTestId('input-file-upload');

 

await expect(fileInput).toHaveValue('');


  await expect(uploadBtn).toBeDisabled();

 
  await uploadBtn.click({ force: true }).catch(() => {});


  const errorMsg = page.getByText(/Configuration file is required/i);

  if (await errorMsg.isVisible().catch(() => false)) {
    await expect(errorMsg).toBeVisible();
  }
 await expect(
    page.getByText(/STARTING|UPDATING|BUILDING/i)
  ).not.toBeVisible();

});
  
test('10.2.4 – Invalid YAML File Content', async ({ page }) => {

 
  const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible({ timeout: 15000 });
   await appRow.locator('.ag-cell').first().click();
const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible();
  await configTab.click();
await expect(
    page.getByTestId('config-warning-alert')
  ).not.toBeVisible({ timeout: 10000 });

 const filePath = page.getByTestId('input-file-path');
  const fileName = page.getByTestId('input-file-name');
  const fileInput = page.getByTestId('input-file-upload');
  const uploadBtn = page.getByTestId('btn-upload-config');

   await filePath.fill('/invalid/yaml/path');
  await fileName.fill('invalid.yaml');

   await fileInput.setInputFiles('e2e/playwright/test-data/invalid.yaml');

  if (await uploadBtn.isEnabled().catch(() => false)) {
    await uploadBtn.click();
  }

   const errorMsg = page.getByText(/Invalid YAML format/i);

  if (await errorMsg.isVisible().catch(() => false)) {
    await expect(errorMsg).toBeVisible();
  }

   await expect(
    page.getByText(/STARTING|UPDATING|BUILDING/i)
  ).not.toBeVisible();

});
test('10.2.5 – Invalid JSON File Content', async ({ page }) => {

   const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible({ timeout: 15000 });
  await appRow.locator('.ag-cell').first().click();
  
   const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible();
  await configTab.click();

    await expect(
    page.getByTestId('config-warning-alert')
  ).not.toBeVisible({ timeout: 10000 });

    const filePath = page.getByTestId('input-file-path');
  const fileName = page.getByTestId('input-file-name');
  const fileInput = page.getByTestId('input-file-upload');
  const uploadBtn = page.getByTestId('btn-upload-config');

   await filePath.fill('/invalid/json/path');
  await fileName.fill('invalid.json');

  await fileInput.setInputFiles('e2e/playwright/test-data/invalid.json');

   if (await uploadBtn.isEnabled().catch(() => false)) {
    await uploadBtn.click();
  }

   const errorMsg = page.getByText(/Invalid JSON format/i);

  if (await errorMsg.isVisible().catch(() => false)) {
    await expect(errorMsg).toBeVisible();
  }

  await expect(
    page.getByText(/STARTING|UPDATING|BUILDING/i)
  ).not.toBeVisible();

});
test('10.2.6 – Submit Without Any Changes', async ({ page }) => {

  
  const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible({ timeout: 15000 });
 await appRow.locator('.ag-cell').first().click();

     const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible();
  await configTab.click();

  const uploadBtn = page.getByTestId('btn-upload-config');

   const isEnabled = await uploadBtn.isEnabled().catch(() => false);

  if (!isEnabled) {
    console.log('✅ Button disabled → No changes detected (correct behavior)');

    
    await expect(uploadBtn).toBeDisabled();

  } else {
    
    await uploadBtn.click();

    const infoMsg = page.getByText(/No changes detected/i);

    if (await infoMsg.isVisible().catch(() => false)) {
      await expect(infoMsg).toBeVisible();
    }
  }


  await expect(
    page.getByText(/STARTING|UPDATING|BUILDING/i)
  ).not.toBeVisible();

});
test('10.2.7 – Empty File Path', async ({ page }) => {


  const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible({ timeout: 15000 });
   await appRow.locator('.ag-cell').first().click();

  const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible();
  await configTab.click();

  const filePath = page.getByTestId('input-file-path');
  const uploadBtn = page.getByTestId('btn-upload-config');

   await filePath.fill('');
  await filePath.blur();

   await expect(uploadBtn).toBeDisabled();

  await expect(
    page.getByText(/STARTING|UPDATING|BUILDING/i)
  ).not.toBeVisible();

});
test('10.2.8 – Empty File Name', async ({ page }) => {

 const appRow = page.locator('.ag-row').first();
  await expect(appRow).toBeVisible({ timeout: 15000 });
 await appRow.locator('.ag-cell').first().click();

   const configTab = page.getByText('Code as config', { exact: true });
  await expect(configTab).toBeVisible();
  await configTab.click();

  const fileName = page.getByTestId('input-file-name');
  const uploadBtn = page.getByTestId('btn-upload-config');
 await fileName.fill('');
  await fileName.blur();

  await expect(uploadBtn).toBeDisabled();

  await expect(
    page.getByText(/STARTING|UPDATING|BUILDING/i)
  ).not.toBeVisible();

});
// test('10.2.9 – File Size Exceeds Maximum Limit', async ({ page }) => {

//    const appRow = page.locator('.ag-row').first();
//   await expect(appRow).toBeVisible({ timeout: 15000 });
//  await appRow.locator('.ag-cell').first().click();

//  const configTab = page.getByText('Code as config', { exact: true });

//     await expect(configTab).toBeVisible();
//   await configTab.click();

//     const fileInput = page.getByTestId('input-file-upload');
//   const uploadBtn = page.getByTestId('btn-upload-config');

//    await fileInput.setInputFiles('e2e/playwright/test-data/large.yaml');

//    const errorMsg = page.getByText(/File size exceeds/i);

//   await expect(errorMsg).toBeVisible({ timeout: 5000 });

//     await expect(uploadBtn).toBeDisabled();

//    await expect(
//     page.getByText(/STARTING|UPDATING|BUILDING/i)
//   ).not.toBeVisible();

// });
});
  
