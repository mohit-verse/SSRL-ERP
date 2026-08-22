import { test, expect } from '@playwright/test';

test.describe('Phase 6 CA Auditor Portal & Document Routes E2E', () => {

  test('redirects unauthenticated access to /ca-dashboard', async ({ page }) => {
    await page.goto('/ca-dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /ca-dashboard/trips', async ({ page }) => {
    await page.goto('/ca-dashboard/trips');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /ca-dashboard/payments', async ({ page }) => {
    await page.goto('/ca-dashboard/payments');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /ca-dashboard/bills', async ({ page }) => {
    await page.goto('/ca-dashboard/bills');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /ca-dashboard/expenses', async ({ page }) => {
    await page.goto('/ca-dashboard/expenses');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /ca-dashboard/audit', async ({ page }) => {
    await page.goto('/ca-dashboard/audit');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /ca-dashboard/documents', async ({ page }) => {
    await page.goto('/ca-dashboard/documents');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /ca-dashboard/reconciliation', async ({ page }) => {
    await page.goto('/ca-dashboard/reconciliation');
    await expect(page).toHaveURL(/\/login/);
  });
});
