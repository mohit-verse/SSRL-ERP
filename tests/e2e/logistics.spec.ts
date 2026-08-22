import { test, expect } from '@playwright/test';

test.describe('Phase 3 Master Data & Logistics E2E Routes', () => {

  test('redirects unauthenticated access to /parties', async ({ page }) => {
    await page.goto('/parties');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /trips', async ({ page }) => {
    await page.goto('/trips');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /vehicles', async ({ page }) => {
    await page.goto('/vehicles');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /drivers', async ({ page }) => {
    await page.goto('/drivers');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated access to /vehicle-owners', async ({ page }) => {
    await page.goto('/vehicle-owners');
    await expect(page).toHaveURL(/\/login/);
  });
});
