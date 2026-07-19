import { test, expect } from '@playwright/test';
import { selectSwissLocation } from './helpers/location';

test.describe('Language Switcher (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    // Use evaluate to clear localStorage only on initial load, not on reloads
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('language switcher is visible in header', async ({ page }) => {
    await expect(page.getByTestId('lang-switcher')).toBeVisible();
  });

  test('has buttons for DE, EN, FR, IT', async ({ page }) => {
    for (const lang of ['de', 'en', 'fr', 'it']) {
      await expect(page.getByTestId(`lang-btn-${lang}`)).toBeVisible();
    }
  });

  test('switching to DE shows German text', async ({ page }) => {
    await page.getByTestId('lang-btn-de').click();
    // Check that landing hero title changes to German
    await expect(page.locator('.landing-hero-title')).toBeVisible();
    await expect(page.locator('.landing-hero-title')).not.toContainText('Swiss Fishing Companion');
  });

  test('switching to FR shows French text', async ({ page }) => {
    await page.getByTestId('lang-btn-fr').click();
    await expect(page.locator('.landing-hero-title')).toBeVisible();
    await expect(page.locator('.landing-hero-title')).not.toContainText('Swiss Fishing Companion');
  });

  test('switching to IT shows Italian text', async ({ page }) => {
    await page.getByTestId('lang-btn-it').click();
    await expect(page.locator('.landing-hero-title')).toBeVisible();
    await expect(page.locator('.landing-hero-title')).not.toContainText('Swiss Fishing Companion');
  });

  test('switching to EN shows English text', async ({ page }) => {
    // Switch away from EN first
    await page.getByTestId('lang-btn-de').click();
    await page.getByTestId('lang-btn-en').click();
    await expect(page.locator('.landing-hero-title')).toContainText('Swiss Fishing Companion');
  });

  test('language preference persists after page reload', async ({ page }) => {
    await page.getByTestId('lang-btn-fr').click();
    await page.reload();
    // Should not fall back to English after reload
    await expect(page.locator('.landing-hero-title')).not.toContainText('Swiss Fishing Companion');
  });

  test('catch edit labels are translated when switching language', async ({ page }) => {
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('add-catch-btn').click();

    await page.getByTestId('lang-btn-fr').click();
    await page.locator('[data-testid^="edit-catch-btn-"]').first().click();

    await expect(page.locator('.catch-form h4')).toContainText('Modifier la prise');
    await expect(page.getByTestId('add-catch-btn')).toContainText('Enregistrer la prise');
  });
});
