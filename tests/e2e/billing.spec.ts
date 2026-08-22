import { test, expect } from '@playwright/test';

test.describe('Phase 5 Immutable Billing & Snapshot E2E Routes', () => {

  test('redirects unauthenticated access to /bills', async ({ page }) => {
    await page.goto('/bills');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /bills/[id]', async ({ page }) => {
    await page.goto('/bills/test-bill-id');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /submissions', async ({ page }) => {
    await page.goto('/submissions');
    await expect(page).toHaveURL(/\/login/);
  });
});
