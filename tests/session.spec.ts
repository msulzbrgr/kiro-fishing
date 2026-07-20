import { test, expect } from '@playwright/test';
import { selectFinnishLocation, selectSwissLocation } from './helpers/location';
import { loadStoredSessions } from './helpers/storage';

type StoredCatch = {
  id: string;
  species: string;
  time?: string;
  notes?: string;
  released: boolean;
  photoIds?: string[];
  recognition?: unknown;
};

type StoredSession = {
  catches: StoredCatch[];
  location?: { country?: string; countryCode?: string };
  regulationSnapshot?: { jurisdiction?: string; userConfirmedUncertain?: boolean; reviewMode?: string; sourceUrls?: string[] };
  regulationState?: string;
};

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
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

    const sessions = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('kiro-fishing');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const records = await new Promise<unknown[]>((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as unknown[]);
      });
      db.close();
      return records;
    });
    const storedSession = sessions[0] as StoredSession;
    expect(storedSession.regulationSnapshot).toBeTruthy();
    expect(storedSession.regulationSnapshot?.userConfirmedUncertain).toBe(false);
    expect(storedSession.regulationSnapshot?.reviewMode).toBe('information');
    expect(storedSession.regulationState).toBe('active_current');
  });

  test('creating a session requests persistent storage when available', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, '__persistCallCount', {
        configurable: true,
        writable: true,
        value: 0,
      });

      if (!navigator.storage) return;

      Object.defineProperty(navigator.storage, 'persisted', {
        configurable: true,
        value: async () => false,
      });
      Object.defineProperty(navigator.storage, 'persist', {
        configurable: true,
        value: async () => {
          (window as Window & { __persistCallCount: number }).__persistCallCount += 1;
          return true;
        },
      });
    });

    await page.goto('/');
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();

    await expect(page.locator('.session-card')).toHaveCount(1);
    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __persistCallCount: number }).__persistCallCount))
      .toBe(1);
  });

  test('session card shows create story button', async ({ page }) => {
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();
    const storedSessions = await loadStoredSessions(page);
    const sessionId = (storedSessions[0] as { id: string }).id;
    await expect(page.getByTestId(`create-story-btn-${sessionId}`)).toBeVisible();
  });

  test('create story button triggers a zip download', async ({ page }) => {
    // Intercept OSM tile requests so the test is offline-safe
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());

    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();

    const storedSessions = await loadStoredSessions(page);
    const sessionId = (storedSessions[0] as { id: string }).id;
    const storyBtn = page.getByTestId(`create-story-btn-${sessionId}`);

    // Intercept the download triggered by the story export
    const downloadPromise = page.waitForEvent('download');
    await storyBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^story-.*\.zip$/);
  });

  test('create story button is disabled while generating and restores after', async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());

    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();

    const storedSessions = await loadStoredSessions(page);
    const sessionId = (storedSessions[0] as { id: string }).id;
    const storyBtn = page.getByTestId(`create-story-btn-${sessionId}`);

    const downloadPromise = page.waitForEvent('download');
    await storyBtn.click();
    // Button must be disabled immediately after click
    await expect(storyBtn).toBeDisabled();
    // Button label should switch to the "in progress" text
    await expect(storyBtn).toContainText('Creating Story');
    // Wait for the download to complete, then verify the button is re-enabled
    await downloadPromise;
    await expect(storyBtn).toBeEnabled();
    await expect(storyBtn).toContainText('Create Story');
  });

  test('create story shows error message when generation fails', async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());

    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();

    const storedSessions = await loadStoredSessions(page);
    const sessionId = (storedSessions[0] as { id: string }).id;
    const storyBtn = page.getByTestId(`create-story-btn-${sessionId}`);

    // Patch canvas.toBlob in the live page context so the export promise rejects
    await page.evaluate(() => {
      (HTMLCanvasElement.prototype as { toBlob: unknown }).toBlob = function (
        callback: (blob: Blob | null) => void,
      ) {
        callback(null);
      };
    });

    await storyBtn.click();
    // An error alert should appear in the session footer
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
    await expect(page.locator('[role="alert"]').first()).toContainText('Could not create story');
    // Button must be re-enabled so the user can retry
    await expect(storyBtn).toBeEnabled();
  });

  test('Finland location shows a research prompt and can be saved', async ({ page }) => {
    await selectFinnishLocation(page);

    await expect(page.getByTestId('outside-switzerland-warning')).toBeVisible();
    await expect(page.getByTestId('new-session-research-prompt')).toBeVisible();
    await expect(page.getByTestId('new-session-research-prompt-textarea')).toHaveValue(/Helsinki/);
    await expect(page.getByTestId('new-session-research-prompt-textarea')).toHaveValue(/Finland/);
    await expect(page.getByTestId('create-session-btn')).toBeEnabled();

    await page.getByTestId('create-session-btn').click();
    await expect(page.locator('.session-card')).toHaveCount(1);

    const sessions = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('kiro-fishing');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const records = await new Promise<unknown[]>((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as unknown[]);
      });
      db.close();
      return records;
    });

    const storedSession = sessions[0] as StoredSession;
    expect(storedSession.location?.country).toBe('Finland');
    expect(storedSession.location?.countryCode).toBe('fi');
    expect(storedSession.regulationSnapshot?.jurisdiction).toBe('Finland');
    expect(storedSession.regulationSnapshot?.sourceUrls).toEqual([]);
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
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
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

    // Preview thumbnail should appear and the add-photo button should remain available
    await expect(page.getByTestId('catch-photo-preview')).toBeVisible();
    await expect(page.getByTestId('add-photo-btn')).toBeVisible();

    // Remove photo button should be available
    await expect(page.getByTestId('remove-all-photos-btn')).toBeVisible();

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
    await page.getByTestId('remove-all-photos-btn').click();
    await expect(page.getByTestId('add-photo-btn')).toBeVisible();
    await expect(page.getByTestId('catch-photo-preview')).toHaveCount(0);

    // Add catch without photo
    await page.getByTestId('add-catch-btn').click();
    await page.locator('.catch-item .catch-header').click();
    await expect(page.getByTestId('catch-photo-full')).toHaveCount(0);
  });

  test('photo upload keeps manual species selection while recognition is gated off', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('catch-photo-input').setInputFiles({
      name: 'fish.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });

    await expect(page.getByTestId('catch-recognition-status')).toHaveCount(0);
    await expect(page.getByTestId('catch-recognition-processing')).toHaveCount(0);
    const selectedSpecies = await page.getByTestId('species-select').inputValue();
    expect(selectedSpecies).toBe('');

    await page.getByTestId('species-select').selectOption({ index: 1 });

    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    const sessions = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('kiro-fishing');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const records = await new Promise<unknown[]>((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as unknown[]);
      });
      db.close();
      return records;
    });

    const catchEntry = (sessions[0] as StoredSession).catches[0];
    expect(catchEntry.recognition).toBeUndefined();
  });

  test('manual species selection remains supported with photo upload', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('catch-photo-input').setInputFiles({
      name: 'fish.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });

    await page.getByTestId('species-select').selectOption({ index: 2 });
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    const sessions = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('kiro-fishing');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });

      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const records = await new Promise<unknown[]>((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as unknown[]);
      });
      db.close();
      return records;
    });

    const catchEntry = (sessions[0] as StoredSession).catches[0];
    expect(catchEntry.species).not.toBe('');
    expect(catchEntry.recognition).toBeUndefined();
  });

  test('can edit an existing catch and persist the changes', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.locator('.catch-form textarea').fill('initial catch note');
    await page.getByTestId('add-catch-btn').click();

    await expect(page.locator('.catch-item')).toHaveCount(1);

    const storedSessions = await loadStoredSessions(page);
    const catchId = (storedSessions[0] as StoredSession).catches[0].id;

    const editButton = page.getByTestId(`edit-catch-btn-${catchId}`);
    await editButton.click();

    await expect(page.locator('.catch-form textarea')).toHaveValue('initial catch note');
    await page.getByTestId('species-select').selectOption({ index: 2 });
    const notesField = page.locator('.catch-form textarea');
    await notesField.fill('updated catch note');
    await expect(notesField).toHaveValue('updated catch note');
    await page.locator('.catch-form input[type="checkbox"]').uncheck();
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-form')).toHaveCount(0);

    await expect(page.locator('.catch-item')).toHaveCount(1);
    await page.locator('.catch-item .catch-header').click();
    await expect(page.locator('.catch-notes')).toContainText('updated catch note');

    const sessions = await loadStoredSessions(page);

    const catchEntry = (sessions[0] as StoredSession).catches[0];
    expect(catchEntry.species).not.toBe('');
    expect(catchEntry.notes).toBe('updated catch note');
    expect(catchEntry.released).toBe(false);
  });

  test('can edit catch time and photos', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('catch-time-input').fill('06:45');
    await page.getByTestId('catch-photo-input').setInputFiles({
      name: 'first-fish.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });
    await expect(page.getByTestId('catch-photo-preview')).toBeVisible();
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    const storedSessions = await loadStoredSessions(page);
    const catchId = (storedSessions[0] as StoredSession).catches[0].id;

    await page.getByTestId(`edit-catch-btn-${catchId}`).click();
    await expect(page.getByTestId('catch-time-input')).toHaveValue('06:45');
    await page.getByTestId('catch-time-input').fill('08:15');
    await page.getByTestId('remove-photo-btn-0').click();
    await expect(page.locator('[data-testid^="remove-photo-btn-"]')).toHaveCount(0);
    await page.getByTestId('add-photo-btn').click();
    await page.getByTestId('catch-photo-input').setInputFiles({
      name: 'second-fish.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });
    await expect(page.locator('[data-testid^="remove-photo-btn-"]')).toHaveCount(1);
    await page.getByTestId('add-catch-btn').click();
    await expect(page.getByTestId('catch-time-input')).toHaveCount(0);

    await page.locator('.catch-item .catch-header').click();
    await expect(page.locator('.catch-meta')).toContainText('08:15');
    await expect(page.getByTestId('catch-photo-full')).toBeVisible();

    const updatedSessions = await loadStoredSessions(page);
    const catchEntry = (updatedSessions[0] as StoredSession).catches[0];
    expect(catchEntry.time).toBe('08:15');
    expect(catchEntry.photoIds).toHaveLength(1);
  });

  test('catch location picker button is visible in catch form', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await expect(page.getByTestId('catch-pick-location-btn')).toBeVisible();
    await expect(page.getByTestId('catch-use-gps-btn')).toBeVisible();
  });

  test('can pick catch location on map and it is saved with the catch', async ({ page }) => {
    await page.route('https://nominatim.openstreetmap.org/reverse**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          display_name: 'Zürich, Schweiz',
          address: { state: 'Zürich', city: 'Zürich', country: 'Switzerland', country_code: 'ch' },
        }),
      });
    });

    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });

    // Open location picker modal
    await page.getByTestId('catch-pick-location-btn').click();
    await expect(page.getByTestId('catch-location-picker-modal')).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Click on map to select location
    await page.getByTestId('map-container').click({ position: { x: 240, y: 200 } });

    // Modal should close after location is selected
    await expect(page.getByTestId('catch-location-picker-modal')).toHaveCount(0);

    // Location display should appear in form
    await expect(page.getByTestId('catch-location-display')).toBeVisible();

    // Clear location button should appear
    await expect(page.getByTestId('catch-clear-location-btn')).toBeVisible();

    // Save catch
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    // Verify location is stored with the catch
    const storedSessions = await loadStoredSessions(page);
    const catchEntry = (storedSessions[0] as { catches: Array<{ location?: { lat: number; lng: number } }> }).catches[0];
    expect(catchEntry.location).toBeTruthy();
    expect(typeof catchEntry.location?.lat).toBe('number');
    expect(typeof catchEntry.location?.lng).toBe('number');
  });

  test('can clear catch location', async ({ page }) => {
    await page.route('https://nominatim.openstreetmap.org/reverse**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          display_name: 'Zürich, Schweiz',
          address: { state: 'Zürich', city: 'Zürich', country: 'Switzerland', country_code: 'ch' },
        }),
      });
    });

    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });

    // Pick a location
    await page.getByTestId('catch-pick-location-btn').click();
    await page.getByTestId('map-container').click({ position: { x: 240, y: 200 } });
    await expect(page.getByTestId('catch-location-display')).toBeVisible();

    // Clear it
    await page.getByTestId('catch-clear-location-btn').click();
    await expect(page.getByTestId('catch-location-display')).toHaveCount(0);
    await expect(page.getByTestId('catch-clear-location-btn')).toHaveCount(0);
  });

  test('catch location is shown in expanded catch details', async ({ page }) => {
    await page.route('https://nominatim.openstreetmap.org/reverse**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          display_name: 'Zürich, Schweiz',
          address: { state: 'Zürich', city: 'Zürich', country: 'Switzerland', country_code: 'ch' },
        }),
      });
    });

    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });

    // Pick a location
    await page.getByTestId('catch-pick-location-btn').click();
    await page.getByTestId('map-container').click({ position: { x: 240, y: 200 } });
    await expect(page.getByTestId('catch-location-display')).toBeVisible();

    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    // Expand the catch
    await page.locator('.catch-item .catch-header').click();

    // Location info should be visible in expanded details
    const storedSessions = await loadStoredSessions(page);
    const catchId = (storedSessions[0] as { catches: Array<{ id: string }> }).catches[0].id;
    await expect(page.getByTestId(`catch-location-info-${catchId}`)).toBeVisible();
  });

  test('location picker modal can be dismissed', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('catch-pick-location-btn').click();
    await expect(page.getByTestId('catch-location-picker-modal')).toBeVisible();

    // Close via overlay click
    await page.getByTestId('catch-location-picker-modal').click({ position: { x: 5, y: 5 } });
    await expect(page.getByTestId('catch-location-picker-modal')).toHaveCount(0);
  });
});

test.describe('Edit Session', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
    // Create a session first
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    // Expand the session card
    await page.locator('.session-card .session-header').click();
  });

  test('edit button is visible in session footer', async ({ page }) => {
    await expect(page.getByTestId('edit-session-btn')).toBeVisible();
    await expect(page.getByTestId('edit-session-btn')).toHaveText('');
    await expect(page.getByTestId('delete-session-btn')).toHaveText('');
  });

  test('clicking edit shows the edit form', async ({ page }) => {
    await page.getByTestId('edit-session-btn').click();
    await expect(page.getByTestId('session-edit-form')).toBeVisible();
    await expect(page.getByTestId('edit-session-date')).toBeVisible();
    await expect(page.getByTestId('edit-session-start-time')).toBeVisible();
    await expect(page.getByTestId('edit-session-end-time')).toBeVisible();
    await expect(page.getByTestId('edit-session-notes')).toBeVisible();
    await expect(page.getByTestId('edit-session-save-btn')).toBeVisible();
    await expect(page.getByTestId('edit-session-cancel-btn')).toBeVisible();
  });

  test('edit form is pre-filled with current session values', async ({ page }) => {
    const storedSessions = await loadStoredSessions(page);
    const session = storedSessions[0] as { date: string; startTime: string };

    await page.getByTestId('edit-session-btn').click();
    await expect(page.getByTestId('edit-session-date')).toHaveValue(session.date);
    await expect(page.getByTestId('edit-session-start-time')).toHaveValue(session.startTime);
  });

  test('cancel edit hides the form without saving', async ({ page }) => {
    await page.getByTestId('edit-session-btn').click();
    await page.getByTestId('edit-session-date').fill('2020-01-01');
    await page.getByTestId('edit-session-cancel-btn').click();

    await expect(page.getByTestId('session-edit-form')).toHaveCount(0);
    await expect(page.getByTestId('edit-session-btn')).toBeVisible();

    // The displayed date should not have changed to 2020-01-01
    await expect(page.locator('.session-date strong')).not.toContainText('2020-01-01');
  });

  test('can save edited date and start time', async ({ page }) => {
    await page.getByTestId('edit-session-btn').click();
    await page.getByTestId('edit-session-date').fill('2023-06-15');
    await page.getByTestId('edit-session-start-time').fill('07:30');
    await page.getByTestId('edit-session-save-btn').click();

    // Edit form should close
    await expect(page.getByTestId('session-edit-form')).toHaveCount(0);

    // Session header should reflect updated values
    await expect(page.locator('.session-date strong')).toContainText('2023-06-15');
    await expect(page.locator('.session-meta')).toContainText('07:30');

    // Persisted in storage
    const storedSessions = await loadStoredSessions(page);
    const storedSession = storedSessions[0] as { date: string; startTime: string };
    expect(storedSession.date).toBe('2023-06-15');
    expect(storedSession.startTime).toBe('07:30');
  });

  test('can save an end time via edit form', async ({ page }) => {
    await page.getByTestId('edit-session-btn').click();
    await page.getByTestId('edit-session-end-time').fill('15:45');
    await page.getByTestId('edit-session-save-btn').click();

    await expect(page.getByTestId('session-edit-form')).toHaveCount(0);

    const storedSessions = await loadStoredSessions(page);
    const storedSession = storedSessions[0] as { endTime?: string };
    expect(storedSession.endTime).toBe('15:45');
  });

  test('can save notes via edit form', async ({ page }) => {
    await page.getByTestId('edit-session-btn').click();
    await page.getByTestId('edit-session-notes').fill('Great fishing trip!');
    await page.getByTestId('edit-session-save-btn').click();

    await expect(page.getByTestId('session-edit-form')).toHaveCount(0);
    await expect(page.locator('.session-notes')).toContainText('Great fishing trip!');

    const storedSessions = await loadStoredSessions(page);
    const storedSession = storedSessions[0] as { notes?: string };
    expect(storedSession.notes).toBe('Great fishing trip!');
  });

  test('can clear end time via edit form', async ({ page }) => {
    // First set an end time
    await page.getByTestId('edit-session-btn').click();
    await page.getByTestId('edit-session-end-time').fill('16:00');
    await page.getByTestId('edit-session-save-btn').click();
    await expect(page.getByTestId('session-edit-form')).toHaveCount(0);

    let storedSessions = await loadStoredSessions(page);
    expect((storedSessions[0] as { endTime?: string }).endTime).toBe('16:00');

    // Now clear it
    await page.getByTestId('edit-session-btn').click();
    await page.getByTestId('edit-session-end-time').fill('');
    await page.getByTestId('edit-session-save-btn').click();
    await expect(page.getByTestId('session-edit-form')).toHaveCount(0);

    storedSessions = await loadStoredSessions(page);
    expect((storedSessions[0] as { endTime?: string }).endTime).toBeUndefined();
  });
});

test.describe('Dismissible panels — regulation info alert', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
    // Create a strict-mode session at ZH (stale regulation → active_confirmed_uncertain)
    await page.getByTestId('nav-new').click();
    await page.getByTestId('regulation-strict-mode-checkbox').check();
    await selectSwissLocation(page);
    await page.getByTestId('regulation-confirm-checkbox').check();
    await page.getByTestId('create-session-btn').click();
    // Expand the session card
    await page.locator('.session-card .session-header').click();
  });

  test('dismiss button is visible and hides the regulation info panel', async ({ page }) => {
    await expect(page.getByTestId('session-regulation-alert')).toBeVisible();
    await expect(page.getByTestId('dismiss-regulation-alert-btn')).toBeVisible();
    await page.getByTestId('dismiss-regulation-alert-btn').click();
    await expect(page.getByTestId('session-regulation-alert')).toHaveCount(0);
  });

  test('regulation info panel re-appears when a new catch is logged', async ({ page }) => {
    // Dismiss the panel
    await page.getByTestId('dismiss-regulation-alert-btn').click();
    await expect(page.getByTestId('session-regulation-alert')).toHaveCount(0);

    // Add a catch to change the catch count
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('add-catch-btn').click();

    // Panel should re-appear because catch count changed
    await expect(page.getByTestId('session-regulation-alert')).toBeVisible();
  });

  test('warning alert for pending checkpoint does not show dismiss button', async ({ page }) => {
    // Navigate to the Map tab in the session body
    await page.locator('.session-body .tab-bar button').filter({ hasText: 'Map' }).click();

    // Mock Nominatim to return a different Swiss canton (Bern / BE)
    await page.route('https://nominatim.openstreetmap.org/reverse**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          display_name: 'Bern, Schweiz',
          address: { state: 'Bern', city: 'Bern', country: 'Switzerland', country_code: 'ch' },
        }),
      });
    });

    // Click the map to trigger a canton change; strict mode creates a pending checkpoint
    await page.getByTestId('map-container').click({ position: { x: 240, y: 200 } });

    // Warning alert should be visible
    await expect(page.getByTestId('session-regulation-alert')).toBeVisible();

    // Dismiss button must NOT be present for pending (unconfirmed) checkpoints
    await expect(page.getByTestId('dismiss-regulation-alert-btn')).toHaveCount(0);

    // Confirm button should be shown instead
    await expect(page.getByTestId('confirm-regulation-change-btn')).toBeVisible();
  });
});

test.describe('Dismissible panels — research prompt', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
    // Create a session outside Switzerland (Finland) so the research prompt is shown
    await page.getByTestId('nav-new').click();
    await selectFinnishLocation(page);
    await page.getByTestId('create-session-btn').click();
    // Expand the session card
    await page.locator('.session-card .session-header').click();
  });

  test('dismiss button is visible and hides the research prompt', async ({ page }) => {
    const storedSessions = await loadStoredSessions(page);
    const sessionId = (storedSessions[0] as { id: string }).id;

    await expect(page.getByTestId(`session-research-prompt-${sessionId}`)).toBeVisible();
    await expect(page.getByTestId(`session-research-prompt-${sessionId}-dismiss`)).toBeVisible();
    await page.getByTestId(`session-research-prompt-${sessionId}-dismiss`).click();
    await expect(page.getByTestId(`session-research-prompt-${sessionId}`)).toHaveCount(0);
  });

  test('research prompt re-appears when a new catch is logged', async ({ page }) => {
    const storedSessions = await loadStoredSessions(page);
    const sessionId = (storedSessions[0] as { id: string }).id;

    // Dismiss the prompt
    await page.getByTestId(`session-research-prompt-${sessionId}-dismiss`).click();
    await expect(page.getByTestId(`session-research-prompt-${sessionId}`)).toHaveCount(0);

    // Add a catch to change the catch count
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('add-catch-btn').click();

    // Prompt should re-appear because catch count changed
    await expect(page.getByTestId(`session-research-prompt-${sessionId}`)).toBeVisible();
  });
});
