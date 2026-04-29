import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

test.describe('Export / Import Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
  });

  test('export and import buttons are visible in header', async ({ page }) => {
    await expect(page.getByTestId('export-btn')).toBeVisible();
    await expect(page.getByTestId('import-btn')).toBeVisible();
  });

  test('export triggers a file download', async ({ page }) => {
    // Create a session first so there's data to export
    await page.getByTestId('nav-new').click();
    await page.getByTestId('create-session-btn').click();
    await page.goto('/');

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-btn').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/kiro-fishing-backup-.+\.json/);
  });

  test('import replaces sessions and shows success message', async ({ page }) => {
    // Create a temp file with valid export payload
    const payload = {
      version: '1.0',
      app: 'kiro-fishing',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          id: 'test-123',
          date: '2026-01-01',
          startTime: '08:00',
          location: { lat: 47.3769, lng: 8.5417 },
          weather: {},
          water: {},
          catches: [],
        },
      ],
    };

    const tmpFile = path.join(os.tmpdir(), 'kiro-test-import.json');
    fs.writeFileSync(tmpFile, JSON.stringify(payload));

    // Mock the confirm dialog to auto-accept
    page.on('dialog', (dialog) => dialog.accept());

    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    // Success status should appear
    await expect(page.locator('.data-status--success')).toBeVisible({ timeout: 5000 });

    // Navigate to sessions to verify the imported session is shown
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.session-card')).toHaveCount(1);

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  test('import shows error for invalid file', async ({ page }) => {
    const tmpFile = path.join(os.tmpdir(), 'kiro-invalid.json');
    fs.writeFileSync(tmpFile, JSON.stringify({ bad: 'data' }));

    page.on('dialog', (dialog) => dialog.accept());

    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    await expect(page.locator('.data-status--error')).toBeVisible({ timeout: 5000 });

    fs.unlinkSync(tmpFile);
  });
});
