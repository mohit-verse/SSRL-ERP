import { test, expect } from '@playwright/test';

test.describe('Phase 4 Payment & Treasury E2E Routes', () => {

  test('redirects unauthenticated access to /payments', async ({ page }) => {
    await page.goto('/payments');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /payments/detail', async ({ page }) => {
    await page.goto('/payments/test-id');
    await expect(page).toHaveURL(/\/login/);
  });
});
