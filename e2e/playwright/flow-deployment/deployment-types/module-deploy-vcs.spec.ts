import { test, expect } from '@playwright/test';

test.describe('VCS (Version Control System) Deployment Flow', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForLoadState('networkidle');
        if (page.url().includes('login')) {
            await page.locator('input[formcontrolname="username"]').fill('Testing');
            await page.locator('input[formcontrolname="password"]').fill('Test@123');
            await page.getByTestId('btn-login').click();
            await page.waitForURL(/.*\/projects.*/, { timeout: 60000 });
            await page.waitForLoadState('networkidle');
        }

        const projectCard = page.getByTestId('project-card').first();
        await expect(projectCard).toBeVisible({ timeout: 60000 });
        await projectCard.click();

        const envCard = page.getByTestId('environment-card').first();
        await expect(envCard).toBeVisible({ timeout: 60000 });
        await envCard.click();

        const proceedBtn = page.getByTestId('proceed-btn');
        await expect(proceedBtn).toBeEnabled({ timeout: 60000 });
        await proceedBtn.click();

        await page.waitForURL(/.*\/applications$/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');

        const newAppBtn = page.getByTestId('btn-new-application');
        await expect(newAppBtn).toBeVisible({ timeout: 60000 });
        await newAppBtn.click();

        await page.waitForURL(/.*\/create-application$/, { timeout: 60000 });
        await page.waitForLoadState('networkidle');
    });

    test.describe('Positive Scenarios', () => {

        test('1.1.3 – Fetch Repositories from VCS', async ({ page }) => {
            const vcsSelect = page.getByTestId('select-type');
            await vcsSelect.click();

            const repoResponsePromise = page.waitForResponse(res => res.request().method() === 'GET' && (res.url().includes('github') || res.url().includes('gitlab') || res.url().includes('repos')), { timeout: 30000 }).catch(() => null);

            await page.getByTestId('option-type-github').click();
            await repoResponsePromise;

            const repoSelect = page.locator('select[formcontrolname="selectedRepo"]');
            await expect(repoSelect).toBeVisible();
            await expect(repoSelect).not.toContainText('No Repo available', { timeout: 30000 });

            const repoCount = await repoSelect.locator('option').count();
            expect(repoCount).toBeGreaterThan(0);
        });

        test('1.1.4 – Fetch Branches for Selected Repository', async ({ page }) => {
            const vcsSelect = page.getByTestId('select-type');
            await vcsSelect.click();
            await page.getByTestId('option-type-github').click();

            const repoSelect = page.locator('select[formcontrolname="selectedRepo"]');
            await expect(repoSelect).not.toContainText('No Repo available', { timeout: 30000 });

            const branchResponsePromise = page.waitForResponse(res => res.request().method() === 'GET' && res.url().includes('branch'), { timeout: 30000 }).catch(() => null);

            await repoSelect.selectOption({ index: 1 });
            await branchResponsePromise;

            const branchSelect = page.locator('select[formcontrolname="branchName"]');
            await expect(branchSelect).toBeVisible();
            await expect(branchSelect).not.toContainText('No branches available', { timeout: 15000 });

            const branchCount = await branchSelect.locator('option').count();
            expect(branchCount).toBeGreaterThan(0);

            await branchSelect.selectOption({ index: 1 });
            await expect(branchSelect).toHaveValue(/.+/);
        });



    });

    test.describe('Negative Scenarios', () => {

        // test('1.2.1 – VCS Not Selected', async ({ page }) => {
        //     const nextBtn = page.getByTestId('btn-next');
        //     await nextBtn.click();

        //     const errorMsg = page.getByTestId('error-type-required');
        //     await expect(errorMsg).toBeVisible();
        // });

        // test('1.2.3 – Branch Not Selected', async ({ page }) => {
        //     await page.getByTestId('select-type').click();
        //     await page.getByTestId('option-type-github').click();

        //     const repoSelect = page.locator('select[formcontrolname="selectedRepo"]');
        //     await expect(repoSelect).not.toContainText('No Repo available', { timeout: 30000 });
        //     await repoSelect.selectOption({ index: 1 });

        //     const branchSelect = page.locator('select[formcontrolname="branchName"]');
        //     await expect(branchSelect).not.toContainText('No branches available', { timeout: 15000 });

        //     await branchSelect.evaluate((el: HTMLSelectElement) => {
        //         el.value = '';
        //         el.dispatchEvent(new Event('change'));
        //     });

        //     await page.getByTestId('btn-next').click();
        //     await expect(page.getByTestId('error-branch-required')).toBeVisible();
        // });

        test('1.2.9 – Concurrent – Same Environment, Different Repo, Different Branch, Same Deployment Name', async ({ page }) => {
            await page.evaluate(() => {
                const deployments = JSON.parse(localStorage.getItem('availableDeployments') || '[]');
                deployments.push('existing-app-name');
                localStorage.setItem('availableDeployments', JSON.stringify(deployments));
            });
            await page.reload({ waitUntil: 'networkidle' });

            await page.getByTestId('select-type').click();
            await page.getByTestId('option-type-github').click();

            await page.locator('select[formcontrolname="selectedRepo"]').selectOption({ index: 1 });

            const nameInput = page.locator('input[formcontrolname="name"]');
            await nameInput.fill('existing-app-name');
            await nameInput.blur();

            await expect(page.getByTestId('error-name-validation')).toBeVisible();

            const nextBtn = page.getByTestId('btn-next');
            await expect(nextBtn).toBeDisabled();
        });
    });
});
