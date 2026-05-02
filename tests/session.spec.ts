import { test, expect } from '@playwright/test';
import { selectSwissLocation } from './helpers/location';

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    // Navigate to New session form
    await page.getByTestId('nav-new').click();
  });

  test('new session form renders required fields', async ({ page }) => {
    await expect(page.locator('.new-session-form')).toBeVisible();
    await expect(page.getByTestId('session-date')).toBeVisible();
    await expect(page.getByTestId('session-time')).toBeVisible();
    await expect(page.getByTestId('create-session-btn')).toBeVisible();
    await expect(page.getByTestId('select-location-btn')).toBeVisible();
    await expect(page.getByTestId('regulation-review')).toBeVisible();
    await expect(page.getByTestId('create-session-btn')).toBeDisabled();
    await expect(page.getByTestId('regulation-strict-mode-checkbox')).not.toBeChecked();
  });

  test('information mode allows session creation without regulation confirmation', async ({ page }) => {
    await expect(page.getByTestId('create-session-btn')).toBeDisabled();
    await selectSwissLocation(page);
    await expect(page.getByTestId('regulation-confirm-checkbox')).toHaveCount(0);
    await expect(page.getByTestId('create-session-btn')).toBeEnabled();
  });

  test('strict mode requires regulation confirmation before creating a session', async ({ page }) => {
    await page.getByTestId('regulation-strict-mode-checkbox').check();
    await expect(page.getByTestId('create-session-btn')).toBeDisabled();
    await selectSwissLocation(page);
    await expect(page.getByTestId('regulation-confirm-checkbox')).toBeEnabled();
    await expect(page.getByTestId('create-session-btn')).toBeDisabled();
    await page.getByTestId('regulation-confirm-checkbox').check();
    await expect(page.getByTestId('create-session-btn')).toBeEnabled();
  });

  test('can create a session and see it in session list', async ({ page }) => {
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();

    // Should redirect to sessions tab
    await expect(page.locator('.session-list')).toBeVisible();
    // One session card should exist
    await expect(page.locator('.session-card')).toHaveCount(1);

    const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('kiro_fishing_sessions') ?? '[]'));
    expect(sessions[0].regulationSnapshot.userConfirmedUncertain).toBe(false);
    expect(sessions[0].regulationSnapshot.reviewMode).toBe('information');
    expect(sessions[0].regulationState).toBe('active_current');
  });

  test('cancel returns to sessions tab', async ({ page }) => {
    await page.getByTestId('cancel-session-btn').click();
    await expect(page.locator('.page-header h2')).toBeVisible();
  });

  test('empty sessions list shows empty state', async ({ page }) => {
    // Go to sessions without creating one
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.empty-state-large')).toBeVisible();
  });
});

test.describe('Catch Log', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    // Create a session first
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    // Expand the session card
    await page.locator('.session-card .session-header').click();
  });

  test('can open catch log form', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await expect(page.locator('.catch-form')).toBeVisible();
    await expect(page.getByTestId('species-select')).toBeVisible();
  });

  test('add catch button is disabled without species', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    const addBtn = page.getByTestId('add-catch-btn');
    await expect(addBtn).toBeDisabled();
  });

  test('can add a catch with species selected', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    // Select a species
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('add-catch-btn').click();
    // Catch should appear in the list
    await expect(page.locator('.catch-item')).toHaveCount(1);
  });

  test('photo upload button is visible in catch form', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await expect(page.getByTestId('add-photo-btn')).toBeVisible();
    await expect(page.getByTestId('catch-photo-input')).toBeHidden();
  });

  // Minimal 1×1 PNG for upload tests
  const MINIMAL_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

  test('can attach a photo to a catch and see it when expanded', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });

    await page.getByTestId('catch-photo-input').setInputFiles({
      name: 'fish.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });

    // Preview thumbnail should appear and the add-photo button should disappear
    await expect(page.getByTestId('catch-photo-preview')).toBeVisible();
    await expect(page.getByTestId('add-photo-btn')).toHaveCount(0);

    // Remove photo button should be available
    await expect(page.getByTestId('remove-photo-btn')).toBeVisible();

    // Add the catch
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    // Expand the catch — photo should show
    await page.locator('.catch-item .catch-header').click();
    await expect(page.getByTestId('catch-photo-full')).toBeVisible();
  });

  test('can remove a photo before saving catch', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });

    await page.getByTestId('catch-photo-input').setInputFiles({
      name: 'fish.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });
    await expect(page.getByTestId('catch-photo-preview')).toBeVisible();

    // Remove the photo
    await page.getByTestId('remove-photo-btn').click();
    await expect(page.getByTestId('add-photo-btn')).toBeVisible();
    await expect(page.getByTestId('catch-photo-preview')).toHaveCount(0);

    // Add catch without photo
    await page.getByTestId('add-catch-btn').click();
    await page.locator('.catch-item .catch-header').click();
    await expect(page.getByTestId('catch-photo-full')).toHaveCount(0);
  });
});
