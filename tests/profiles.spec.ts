import { test, expect } from '@playwright/test';
import { selectSwissLocation } from './helpers/location';
import { loadStoredProfiles, loadStoredSessions } from './helpers/storage';

// Minimal 1×1 PNG for photo upload tests
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('Profiles', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
    await page.getByTestId('nav-profiles').click();
    await expect(page.getByTestId('profiles-view')).toBeVisible();
  });

  test('profiles page shows empty state when no profiles exist', async ({ page }) => {
    await expect(page.getByTestId('profiles-empty-state')).toBeVisible();
  });

  test('can open new profile form', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page.getByTestId('profile-nickname-input')).toBeVisible();
    await expect(page.getByTestId('save-profile-btn')).toBeDisabled();
  });

  test('save button is disabled until nickname is entered', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await expect(page.getByTestId('save-profile-btn')).toBeDisabled();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await expect(page.getByTestId('save-profile-btn')).toBeEnabled();
  });

  test('can create a profile and see it in the list', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    await expect(page.getByTestId('profile-form')).toHaveCount(0);
    await expect(page.locator('.profile-card')).toHaveCount(1);
    await expect(page.locator('.profile-nickname')).toContainText('Alice');
  });

  test('created profile is persisted in IndexedDB', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Bob');
    await page.getByTestId('save-profile-btn').click();

    const profiles = await loadStoredProfiles(page);
    expect(profiles).toHaveLength(1);
    expect((profiles[0] as { nickname: string }).nickname).toBe('Bob');
  });

  test('creating a profile requests persistent storage when available', async ({ page }) => {
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
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Persistent');
    await page.getByTestId('save-profile-btn').click();

    await page.waitForFunction(
      () => (window as Window & { __persistCallCount: number }).__persistCallCount === 1,
      { timeout: 5000 },
    );
  });

  test('can create a profile with a photo', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Charlie');

    await page.getByTestId('profile-photo-input').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });

    await expect(page.getByTestId('profile-photo-preview')).toBeVisible();
    await page.getByTestId('save-profile-btn').click();

    await expect(page.locator('.profile-card')).toHaveCount(1);
    // Profile avatar should display the uploaded image
    const profiles = await loadStoredProfiles(page);
    expect((profiles[0] as { nickname: string; photoBlob?: unknown }).photoBlob).toBeTruthy();
  });

  test('can remove photo before saving profile', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Dave');

    await page.getByTestId('profile-photo-input').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: MINIMAL_PNG,
    });
    await expect(page.getByTestId('profile-photo-preview')).toBeVisible();

    await page.getByTestId('profile-remove-photo-btn').click();
    await expect(page.getByTestId('profile-photo-preview')).toHaveCount(0);
    await expect(page.getByTestId('profile-add-photo-btn')).toBeVisible();

    await page.getByTestId('save-profile-btn').click();
    const profiles = await loadStoredProfiles(page);
    expect((profiles[0] as { photoBlob?: unknown }).photoBlob).toBeFalsy();
  });

  test('can create multiple profiles', async ({ page }) => {
    for (const name of ['Alice', 'Bob', 'Charlie']) {
      await page.getByTestId('new-profile-btn').click();
      await page.getByTestId('profile-nickname-input').fill(name);
      await page.getByTestId('save-profile-btn').click();
    }
    await expect(page.locator('.profile-card')).toHaveCount(3);
  });

  test('can cancel new profile form', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Temp');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('profile-form')).toHaveCount(0);
    await expect(page.locator('.profile-card')).toHaveCount(0);
  });

  test('can edit an existing profile', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    const profiles = await loadStoredProfiles(page);
    const profileId = (profiles[0] as { id: string }).id;

    await page.getByTestId(`edit-profile-btn-${profileId}`).click();
    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page.getByTestId('profile-nickname-input')).toHaveValue('Alice');

    await page.getByTestId('profile-nickname-input').fill('Alice Updated');
    await page.getByTestId('save-profile-btn').click();

    await expect(page.locator('.profile-nickname')).toContainText('Alice Updated');

    const updated = await loadStoredProfiles(page);
    expect((updated[0] as { nickname: string }).nickname).toBe('Alice Updated');
  });

  test('can delete a profile', async ({ page }) => {
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('ToDelete');
    await page.getByTestId('save-profile-btn').click();

    const profiles = await loadStoredProfiles(page);
    const profileId = (profiles[0] as { id: string }).id;

    page.on('dialog', (dialog) => dialog.accept());
    await page.getByTestId(`delete-profile-btn-${profileId}`).click();

    await expect(page.locator('.profile-card')).toHaveCount(0);
    await expect(page.getByTestId('profiles-empty-state')).toBeVisible();

    const remaining = await loadStoredProfiles(page);
    expect(remaining).toHaveLength(0);
  });
});

test.describe('Profile detail view', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
  });

  async function createProfileAndSession(page: Parameters<typeof selectSwissLocation>[0]) {
    // Create a profile
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    // Create a session with a catch assigned to the profile
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();

    // Log a catch and assign the profile
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('catch-profile-select').selectOption({ label: 'Alice' });
    await page.getByTestId('add-catch-btn').click();
  }

  test('profile detail view shows catches assigned to that profile', async ({ page }) => {
    await createProfileAndSession(page);

    const profiles = await loadStoredProfiles(page);
    const profileId = (profiles[0] as { id: string }).id;

    await page.getByTestId('nav-profiles').click();
    await page.getByTestId(`profile-open-btn-${profileId}`).click();

    await expect(page.getByTestId('profile-detail-view')).toBeVisible();
    await expect(page.getByTestId('profile-detail-nickname')).toContainText('Alice');
    await expect(page.locator('.profile-catch-item')).toHaveCount(1);
  });

  test('profile detail view shows no-catches message when profile has no catches', async ({ page }) => {
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Empty');
    await page.getByTestId('save-profile-btn').click();

    const profiles = await loadStoredProfiles(page);
    const profileId = (profiles[0] as { id: string }).id;
    await page.getByTestId(`profile-open-btn-${profileId}`).click();

    await expect(page.getByTestId('profile-no-catches')).toBeVisible();
  });

  test('back button returns to profiles list', async ({ page }) => {
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    const profiles = await loadStoredProfiles(page);
    const profileId = (profiles[0] as { id: string }).id;
    await page.getByTestId(`profile-open-btn-${profileId}`).click();
    await expect(page.getByTestId('profile-detail-view')).toBeVisible();

    await page.getByTestId('profile-back-btn').click();
    await expect(page.getByTestId('profiles-view')).toBeVisible();
    await expect(page.locator('.profile-card')).toHaveCount(1);
  });

  test('species filter in profile detail hides catches of other species', async ({ page }) => {
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    const profiles = await loadStoredProfiles(page);
    const profileId = (profiles[0] as { id: string }).id;

    // Create session and add two catches of different species
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();

    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('catch-profile-select').selectOption({ label: 'Alice' });
    await page.getByTestId('add-catch-btn').click();

    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 2 });
    await page.getByTestId('catch-profile-select').selectOption({ label: 'Alice' });
    await page.getByTestId('add-catch-btn').click();

    await page.getByTestId('nav-profiles').click();
    await page.getByTestId(`profile-open-btn-${profileId}`).click();

    // Should show 2 catches initially
    await expect(page.locator('.profile-catch-item')).toHaveCount(2);

    // Get the species names from the stored catches
    const sessions = await loadStoredSessions(page);
    type SessionType = { catches: Array<{ profileId?: string; species: string }> };
    const profileCatches = (sessions[0] as SessionType).catches.filter((c) => c.profileId === profileId);
    const firstSpecies = profileCatches[0].species;

    // Filter to first species
    await page.getByTestId('profile-filter-species').selectOption(firstSpecies);
    await expect(page.locator('.profile-catch-item')).toHaveCount(1);

    // Reset to all species
    await page.getByTestId('profile-filter-species').selectOption('');
    await expect(page.locator('.profile-catch-item')).toHaveCount(2);
  });
});

test.describe('Catch profile assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      void indexedDB.deleteDatabase('kiro-fishing');
    });
    await page.goto('/');
    await page.getByTestId('nav-new').click();
    await selectSwissLocation(page);
    await page.getByTestId('create-session-btn').click();
    await page.locator('.session-card .session-header').click();
  });

  test('profile dropdown is visible in catch form when profiles exist', async ({ page }) => {
    // Create a profile first
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    // Go back to sessions and open catch form
    await page.getByTestId('nav-sessions').click();
    await page.locator('.session-card .session-header').click();
    await page.getByTestId('log-catch-btn').click();

    await expect(page.getByTestId('catch-profile-select')).toBeVisible();
  });

  test('profile dropdown is not visible when no profiles exist', async ({ page }) => {
    await page.getByTestId('log-catch-btn').click();
    await expect(page.getByTestId('catch-profile-select')).toHaveCount(0);
  });

  test('can assign a profile to a catch and it is persisted', async ({ page }) => {
    // Create a profile
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    // Go to sessions, open catch form
    await page.getByTestId('nav-sessions').click();
    await page.locator('.session-card .session-header').click();
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('catch-profile-select').selectOption({ label: 'Alice' });
    await page.getByTestId('add-catch-btn').click();

    await expect(page.locator('.catch-item')).toHaveCount(1);

    // Verify profileId is stored
    const sessions = await loadStoredSessions(page);
    const profiles = await loadStoredProfiles(page);
    const profileId = (profiles[0] as { id: string }).id;
    type SessionType = { catches: Array<{ profileId?: string }> };
    const catchEntry = (sessions[0] as SessionType).catches[0];
    expect(catchEntry.profileId).toBe(profileId);
  });

  test('profile badge is shown on catch item when profile is assigned', async ({ page }) => {
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    await page.getByTestId('nav-sessions').click();
    await page.locator('.session-card .session-header').click();
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('catch-profile-select').selectOption({ label: 'Alice' });
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);
    await expect(page.locator('.badge-profile')).toBeVisible();
    await expect(page.locator('.badge-profile')).toContainText('Alice');
  });

  test('profile can be cleared from catch during edit', async ({ page }) => {
    await page.getByTestId('nav-profiles').click();
    await page.getByTestId('new-profile-btn').click();
    await page.getByTestId('profile-nickname-input').fill('Alice');
    await page.getByTestId('save-profile-btn').click();

    await page.getByTestId('nav-sessions').click();
    await page.locator('.session-card .session-header').click();

    // Add catch with profile
    await page.getByTestId('log-catch-btn').click();
    await page.getByTestId('species-select').selectOption({ index: 1 });
    await page.getByTestId('catch-profile-select').selectOption({ label: 'Alice' });
    await page.getByTestId('add-catch-btn').click();
    await expect(page.locator('.catch-item')).toHaveCount(1);

    // Edit and clear profile
    const sessions = await loadStoredSessions(page);
    const catchId = (sessions[0] as { catches: Array<{ id: string }> }).catches[0].id;
    await page.getByTestId(`edit-catch-btn-${catchId}`).click();
    await page.getByTestId('catch-profile-select').selectOption('');
    await page.getByTestId('add-catch-btn').click();

    // Badge should be gone
    await expect(page.getByTestId(`catch-profile-badge-${catchId}`)).toHaveCount(0);

    // Stored catch should have no profileId
    const updated = await loadStoredSessions(page);
    type SessionType = { catches: Array<{ profileId?: string }> };
    expect((updated[0] as SessionType).catches[0].profileId).toBeUndefined();
  });
});
