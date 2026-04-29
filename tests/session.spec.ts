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
  });

  test('requires regulation confirmation before creating a session', async ({ page }) => {
    await expect(page.getByTestId('create-session-btn')).toBeDisabled();
    await expect(page.getByTestId('regulation-confirm-checkbox')).toBeDisabled();
    await selectSwissLocation(page);
    await expect(page.getByTestId('regulation-confirm-checkbox')).toBeEnabled();
    await page.getByTestId('regulation-confirm-checkbox').check();
    await expect(page.getByTestId('create-session-btn')).toBeEnabled();
  });

  test('can create a session and see it in session list', async ({ page }) => {
    await selectSwissLocation(page);
    await page.getByTestId('regulation-confirm-checkbox').check();
    await page.getByTestId('create-session-btn').click();

    // Should redirect to sessions tab
    await expect(page.locator('.session-list')).toBeVisible();
    // One session card should exist
    await expect(page.locator('.session-card')).toHaveCount(1);

    const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('kiro_fishing_sessions') ?? '[]'));
    expect(sessions[0].regulationSnapshot.userConfirmedUncertain).toBe(true);
    expect(sessions[0].regulationState).toBe('active_confirmed_uncertain');
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
    await page.getByTestId('regulation-confirm-checkbox').check();
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
});
