import { test, expect } from '@playwright/test';

test.describe('VCS (Version Control System) Deployment Flow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');

        await page.getByTestId('project-card').first().click();
        await page.getByTestId('environment-card').first().click();
        await page.getByTestId('proceed-btn').click();

        await page.waitForURL('**/applications');
        await page.getByRole('button', { name: /create.*deployment/i }).click();
        await page.waitForURL('**/create-deployments');
    });


    test('Should successfully fetch repositories and branches after selecting VCS provider', async ({ page }) => {

        const vcsSelect = page.getByTestId('select-type');
        await vcsSelect.click();
        await page.getByTestId('option-type-github').click();

        const repoSelect = page.locator('select[formcontrolname="selectedRepo"]');
        await expect(repoSelect).not.toContainText('No Repo available', { timeout: 30000 });

        await repoSelect.selectOption({ index: 1 });

        const branchSelect = page.locator('select[formcontrolname="branchName"]');
        await expect(branchSelect).not.toContainText('No branches available', { timeout: 15000 });

        const branchCount = await branchSelect.locator('option').count();
        expect(branchCount).toBeGreaterThan(0);
    });

    test('Should allow enabling Auto Deploy toggle for VCS deployments', async ({ page }) => {
        await page.getByTestId('select-type').click();
        await page.getByTestId('option-type-github').click();

        const autoDeployToggle = page.locator('input[formcontrolname="vcsAutoDeploy"]');

        await autoDeployToggle.check();
        await expect(autoDeployToggle).toBeChecked();
    });

    test('Should show error when attempting to proceed without selecting a VCS provider', async ({ page }) => {
        const nextBtn = page.getByTestId('btn-next');
        await nextBtn.click();

        const errorMsg = page.locator('.text-danger').filter({ hasText: 'Please select a VCS provider' });
        await expect(errorMsg).toBeVisible();
    });

    test('Should show error when branch is not selected', async ({ page }) => {
        await page.getByTestId('select-type').click();
        await page.getByTestId('option-type-github').click();

        const repoSelect = page.locator('select[formcontrolname="selectedRepo"]');
        await expect(repoSelect).not.toContainText('No Repo available', { timeout: 20000 });
        await repoSelect.selectOption({ index: 1 });

        const branchSelect = page.locator('select[formcontrolname="branchName"]');
        await branchSelect.selectOption('');

        await page.getByTestId('btn-next').click();

        await expect(page.locator('.text-danger').filter({ hasText: 'Please select a branch' })).toBeVisible();
    });

    test('Should block proceeding with a duplicate deployment name', async ({ page }) => {
        await page.getByTestId('select-type').click();
        await page.getByTestId('option-type-github').click();

        await page.locator('select[formcontrolname="selectedRepo"]').selectOption({ index: 1 });

        const nameInput = page.getByTestId('input-name');
        await nameInput.fill('existing-app-name');
        await nameInput.blur();

        await expect(page.locator('.text-danger').filter({ hasText: 'Name is already taken' })).toBeVisible();

        const nextBtn = page.getByTestId('btn-next');
        await expect(nextBtn).toBeDisabled();
    });

});
