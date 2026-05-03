import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
  });

  test('shows app title in header', async ({ page }) => {
    await expect(page.getByTestId('header-brand')).toBeVisible();
  });

  test('shows hero section with CTA button', async ({ page }) => {
    const ctaBtn = page.getByTestId('get-started-btn').first();
    await expect(ctaBtn).toBeVisible();
  });

  test('shows four feature cards', async ({ page }) => {
    const cards = page.locator('.feature-card');
    await expect(cards).toHaveCount(4);
  });

  test('shows app screenshots / mockups section', async ({ page }) => {
    await expect(page.getByTestId('screenshots-heading')).toBeVisible();
    await expect(page.getByTestId('screenshot-map')).toBeVisible();
    await expect(page.getByTestId('screenshot-sessions')).toBeVisible();
    await expect(page.getByTestId('screenshot-catches')).toBeVisible();
  });

  test('shows all 26 canton chips', async ({ page }) => {
    const chips = page.locator('.canton-chip');
    await expect(chips).toHaveCount(26);
  });

  test('Get Started navigates to sessions tab', async ({ page }) => {
    await page.getByTestId('get-started-btn').first().click();
    // After clicking Get Started, sessions tab becomes active
    await expect(page.locator('.page-header h2')).toBeVisible();
  });
});
