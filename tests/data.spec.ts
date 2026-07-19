import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import JSZip from 'jszip';
import { selectSwissLocation } from './helpers/location';
import { loadStoredSessions } from './helpers/storage';

type StoredCatch = {
  id: string;
  species: string;
  notes?: string;
  released: boolean;
  photoIds?: string[];
};

type StoredSession = {
  catches: StoredCatch[];
};

const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('Export / Import Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
  });

  test('export and import buttons are visible in settings', async ({ page }) => {
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('export-btn')).toBeVisible();
    await expect(page.getByTestId('import-btn')).toBeVisible();
  });

  test('export triggers a file download', async ({ page }) => {
    // Create a session first so there's data to export
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.goto('/');

    await page.getByTestId('nav-settings').click();

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-btn').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/kiro-fishing-backup-.+\.zip/);
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

    await page.getByTestId('nav-settings').click();
    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    // Imported session should be visible in sessions tab
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.session-card')).toHaveCount(1);

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  test('import shows error for invalid file', async ({ page }) => {
    const tmpFile = path.join(os.tmpdir(), 'kiro-invalid.json');
    fs.writeFileSync(tmpFile, JSON.stringify({ bad: 'data' }));

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByTestId('nav-settings').click();
    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    await expect(page.locator('.data-status--error')).toBeVisible({ timeout: 5000 });

    fs.unlinkSync(tmpFile);
  });

  test('import V2 zip replaces sessions and shows success message', async ({ page }) => {
    const zip = new JSZip();
    const payload = {
      version: '2.0',
      app: 'kiro-fishing',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          schemaVersion: 2,
          id: 'zip-session-1',
          date: '2026-03-15',
          startTime: '09:00',
          location: { lat: 47.3769, lng: 8.5417 },
          weather: {},
          water: {},
          catches: [],
        },
      ],
      photos: [],
    };
    zip.file('manifest.json', JSON.stringify(payload));
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const tmpFile = path.join(os.tmpdir(), 'kiro-test-import-v2.zip');
    fs.writeFileSync(tmpFile, zipBuffer);

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByTestId('nav-settings').click();
    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    // After a successful import the app navigates to the sessions tab
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.session-card')).toHaveCount(1);

    fs.unlinkSync(tmpFile);
  });

  test('import V2 zip with photos succeeds', async ({ page }) => {
    const sessionId = 'zip-photo-session-1';
    const catchId = 'catch-1';
    const photoId = 'photo-1';

    const zip = new JSZip();
    const payload = {
      version: '2.0',
      app: 'kiro-fishing',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          schemaVersion: 2,
          id: sessionId,
          date: '2026-04-10',
          startTime: '10:00',
          location: { lat: 47.3769, lng: 8.5417 },
          weather: {},
          water: {},
          catches: [
            {
              id: catchId,
              species: 'Trout',
              time: '10:30',
              released: true,
              photoIds: [photoId],
            },
          ],
        },
      ],
      photos: [
        {
          id: photoId,
          fileName: `photos/${photoId}`,
          mimeType: 'image/png',
          sessionId,
          catchId,
        },
      ],
    };
    zip.file('manifest.json', JSON.stringify(payload));
    // A minimal 1×1 transparent PNG (67 bytes)
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    zip.file(`photos/${photoId}`, minimalPng);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const tmpFile = path.join(os.tmpdir(), 'kiro-test-import-v2-photos.zip');
    fs.writeFileSync(tmpFile, zipBuffer);

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByTestId('nav-settings').click();
    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    // After a successful import the app navigates to the sessions tab
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.session-card')).toHaveCount(1);

    fs.unlinkSync(tmpFile);
  });

  test('exported V2 backups can be imported back with edited catches and photos', async ({ page }) => {
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();

    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.locator('.catch-form textarea').fill('initial export note');
    await page.getByTestId('catch-photo-input').setInputFiles({
      name: 'fish.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });
    await expect(page.getByTestId('catch-photo-preview')).toBeVisible();
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    const storedSessions = await loadStoredSessions(page);
    const catchId = (storedSessions[0] as StoredSession).catches[0].id;

    await page.getByTestId(`edit-catch-btn-${catchId}`).click();
    await page.getByTestId('species-select').selectOption({ index: 2 });
    await page.locator('.catch-form textarea').fill('updated export note');
    await page.locator('.catch-form input[type="checkbox"]').uncheck();
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-form')).toHaveCount(0);

    await page.getByTestId('nav-settings').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-btn').click();
    const download = await downloadPromise;

    const tmpFile = path.join(os.tmpdir(), `kiro-test-roundtrip-${Date.now()}.zip`);
    await download.saveAs(tmpFile);

    const exportedZip = await JSZip.loadAsync(fs.readFileSync(tmpFile));
    const manifestText = await exportedZip.file('manifest.json')?.async('string');
    expect(manifestText).toBeTruthy();
    const manifest = JSON.parse(manifestText ?? '{}') as {
      version?: string;
      sessions?: Array<{ catches?: Array<{ notes?: string; released?: boolean; photoIds?: string[] }> }>;
      photos?: Array<unknown>;
    };
    expect(manifest.version).toBe('2.0');
    expect(manifest.sessions).toHaveLength(1);
    expect(manifest.sessions?.[0].catches?.[0].notes).toBe('updated export note');
    expect(manifest.sessions?.[0].catches?.[0].released).toBe(false);
    expect(manifest.sessions?.[0].catches?.[0].photoIds).toHaveLength(1);
    expect(manifest.photos).toHaveLength(1);

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByTestId('import-file-input').setInputFiles(tmpFile);
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.session-card')).toHaveCount(1);
    await page.locator('.session-card .session-header').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);
    await page.locator('.catch-item .catch-header').click();
    await expect(page.locator('.catch-notes')).toContainText('updated export note');
    await expect(page.getByTestId('catch-photo-full')).toBeVisible();

    const importedSessions = await loadStoredSessions(page);
    const importedCatch = (importedSessions[0] as StoredSession).catches[0];
    expect(importedCatch.notes).toBe('updated export note');
    expect(importedCatch.released).toBe(false);
    expect(importedCatch.photoIds).toHaveLength(1);
    fs.unlinkSync(tmpFile);
  });

  test('import V2 zip shows error for missing manifest', async ({ page }) => {
    const zip = new JSZip();
    zip.file('other.json', JSON.stringify({ data: 'no manifest here' }));
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const tmpFile = path.join(os.tmpdir(), 'kiro-test-no-manifest.zip');
    fs.writeFileSync(tmpFile, zipBuffer);

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByTestId('nav-settings').click();
    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    await expect(page.locator('.data-status--error')).toBeVisible({ timeout: 5000 });

    fs.unlinkSync(tmpFile);
  });

  test('import V2 zip shows error for wrong app name in manifest', async ({ page }) => {
    const zip = new JSZip();
    const payload = {
      version: '2.0',
      app: 'some-other-app',
      exportedAt: new Date().toISOString(),
      sessions: [],
      photos: [],
    };
    zip.file('manifest.json', JSON.stringify(payload));
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const tmpFile = path.join(os.tmpdir(), 'kiro-test-wrong-app.zip');
    fs.writeFileSync(tmpFile, zipBuffer);

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByTestId('nav-settings').click();
    const fileInput = page.getByTestId('import-file-input');
    await fileInput.setInputFiles(tmpFile);

    await expect(page.locator('.data-status--error')).toBeVisible({ timeout: 5000 });

    fs.unlinkSync(tmpFile);
  });
});

test.describe('IndexedDB storage migration', () => {
  test('migrates legacy localStorage sessions on first load', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
      localStorage.setItem(
        'kiro_fishing_sessions',
        JSON.stringify([
          {
            id: 'legacy-1',
            date: '2026-02-01',
            startTime: '07:00',
            location: { lat: 47.3769, lng: 8.5417 },
            weather: {},
            water: {},
            catches: [],
          },
        ]),
      );
    });

    await page.goto('/');
    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.session-card')).toHaveCount(1);
  });

  test('shows storage health details in data manager', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('storage-health')).toBeVisible();
  });

  test('migrates schemaVersion 2 sessions to version 3 on import', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');

    const payload = {
      version: '1.0',
      app: 'kiro-fishing',
      exportedAt: new Date().toISOString(),
      sessions: [
        {
          schemaVersion: 2,
          id: 'v2-session-1',
          date: '2026-05-01',
          startTime: '08:00',
          location: { lat: 47.3769, lng: 8.5417 },
          weather: {},
          water: {},
          catches: [
            {
              id: 'catch-v2-1',
              species: 'Trout',
              time: '08:30',
              released: false,
            },
          ],
        },
      ],
    };

    const tmpFile = path.join(os.tmpdir(), 'kiro-test-v2-migration.json');
    fs.writeFileSync(tmpFile, JSON.stringify(payload));

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('import-file-input').setInputFiles(tmpFile);

    await page.getByTestId('nav-sessions').click();
    await expect(page.locator('.session-card')).toHaveCount(1);

    const sessions = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('kiro-fishing');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      const tx = db.transaction('sessions', 'readonly');
      const records = await new Promise<unknown[]>((resolve, reject) => {
        const req = tx.objectStore('sessions').getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result as unknown[]);
      });
      db.close();
      return records;
    });

    const storedSession = sessions[0] as { schemaVersion: number; catches: Array<{ location?: unknown }> };
    expect(storedSession.schemaVersion).toBe(3);
    expect(storedSession.catches[0].location).toBeUndefined();

    fs.unlinkSync(tmpFile);
  });
});
