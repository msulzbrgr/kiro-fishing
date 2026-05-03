import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
  });

  test('bottom nav has four items', async ({ page }) => {
    const navItems = page.locator('.nav-item');
    await expect(navItems).toHaveCount(4);
  });

  test('Home nav item is active by default', async ({ page }) => {
    const homeBtn = page.getByTestId('nav-home');
    await expect(homeBtn).toHaveClass(/active/);
  });

  test('clicking Sessions nav shows sessions page', async ({ page }) => {
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.page-header h2')).toBeVisible();
  });

  test('clicking Laws nav shows map page', async ({ page }) => {
    await page.getByTestId('nav-laws').click();
    await expect(page.locator('.map-view')).toBeVisible();
  });

  test('clicking New nav shows new session form', async ({ page }) => {
    await page.getByTestId('nav-new').click();
    await expect(page.locator('.new-session-form')).toBeVisible();
  });

  test('clicking header brand returns to home page', async ({ page }) => {
    await page.getByTestId('nav-sessions').click();
    await page.getByTestId('header-brand').click();
    await expect(page.locator('.landing-hero')).toBeVisible();
  });
});
