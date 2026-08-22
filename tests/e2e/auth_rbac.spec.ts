import { test, expect } from '@playwright/test';

test.describe('Phase 2 Auth & RBAC E2E Route Boundaries', () => {

  test('redirects unauthenticated user accessing /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user accessing /admin/users to /login', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login/);
  });

  test('displays clean 403 Forbidden page at /forbidden', async ({ page }) => {
    await page.goto('/forbidden');
    await expect(page.locator('h1')).toContainText('403 — Access Denied');
  });

  test('displays login form with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });
});
