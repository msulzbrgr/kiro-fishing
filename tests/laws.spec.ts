import { test, expect } from '@playwright/test';

test.describe('Laws Tab — Canton Regulations Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await page.getByTestId('nav-laws').click();
  });

  test('Laws tab shows the map view', async ({ page }) => {
    await expect(page.locator('.map-view')).toBeVisible();
  });

  test('Canton overview section is visible on Laws tab', async ({ page }) => {
    await expect(page.getByTestId('canton-overview')).toBeVisible();
  });

  test('Canton overview shows all 26 canton cards', async ({ page }) => {
    const cards = page.locator('[data-testid^="canton-card-"]');
    await expect(cards).toHaveCount(26);
  });

  test('Canton cards show the canton code badge', async ({ page }) => {
    await expect(page.getByTestId('canton-card-ZH')).toBeVisible();
    await expect(page.getByTestId('canton-card-BE')).toBeVisible();
    await expect(page.getByTestId('canton-card-SO')).toBeVisible();
    await expect(page.getByTestId('canton-card-JU')).toBeVisible();
  });

  test('Solothurn card expands on click and shows enriched details', async ({ page }) => {
    const soCard = page.getByTestId('canton-card-SO');
    await soCard.locator(".canton-overview-header").click();

    // Enriched content visible
    await expect(soCard.locator('.regulation-records')).toBeVisible();
    await expect(soCard.locator('.buy-permit-btn')).toBeVisible();
    await expect(soCard.locator('.regulation-disclaimer')).toBeVisible();
  });

  test('Bern card expands on click and shows enriched details', async ({ page }) => {
    const beCard = page.getByTestId('canton-card-BE');
    await beCard.locator(".canton-overview-header").click();

    await expect(beCard.locator('.regulation-records')).toBeVisible();
    await expect(beCard.locator('.buy-permit-btn')).toBeVisible();
    await expect(beCard.locator('.regulation-disclaimer')).toBeVisible();
  });

  test('Solothurn and Bern show enriched checkmark badge', async ({ page }) => {
    await expect(page.getByTestId('canton-card-SO').locator('.canton-enriched-badge')).toBeVisible();
    await expect(page.getByTestId('canton-card-BE').locator('.canton-enriched-badge')).toBeVisible();
  });

  test('Non-enriched canton does not show enriched badge', async ({ page }) => {
    // ZH has no regulation records seeded
    await expect(page.getByTestId('canton-card-ZH').locator('.canton-enriched-badge')).toHaveCount(0);
  });

  test('Stale cantons (non-enriched) show staleness icon', async ({ page }) => {
    // ZH lastVerified is 2024-01-01 (>180 days ago), so it should show stale icon
    await expect(page.getByTestId('canton-card-ZH').locator('.stale-icon')).toBeVisible();
  });

  test('Fresh cantons (SO/BE) do not show staleness icon', async ({ page }) => {
    await expect(page.getByTestId('canton-card-SO').locator('.stale-icon')).toHaveCount(0);
    await expect(page.getByTestId('canton-card-BE').locator('.stale-icon')).toHaveCount(0);
  });

  test('ZH card expands and shows disclaimer and legal sources', async ({ page }) => {
    await page.getByTestId('canton-card-ZH').locator('.canton-overview-header').click();
    const zhCard = page.getByTestId('canton-card-ZH');
    await expect(zhCard.locator('.regulation-disclaimer')).toBeVisible();
    await expect(zhCard.locator('.laws-list')).toBeVisible();
  });

  test('Expanding a card then clicking again collapses it', async ({ page }) => {
    const soCard = page.getByTestId('canton-card-SO');
    const headerBtn = soCard.locator('.canton-overview-header');

    await headerBtn.click();
    await expect(soCard.locator('.canton-overview-detail')).toBeVisible();

    await headerBtn.click();
    await expect(soCard.locator('.canton-overview-detail')).toHaveCount(0);
  });

  test('Canton overview title is localized', async ({ page }) => {
    const title = page.locator('.canton-overview-intro h3');
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();
  });

  test('Buy permit link on SO points to official cantonal site', async ({ page }) => {
    await page.getByTestId('canton-card-SO').locator('.canton-overview-header').click();
    const link = page.getByTestId('buy-permit-SO');
    await expect(link).toHaveAttribute('href', /so\.ch/);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('Buy permit link on BE points to official cantonal site', async ({ page }) => {
    await page.getByTestId('canton-card-BE').locator('.canton-overview-header').click();
    const link = page.getByTestId('buy-permit-BE');
    await expect(link).toHaveAttribute('href', /be\.ch/);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('Overview is visible even when no map location is selected', async ({ page }) => {
    // No location was selected — overview should still render
    await expect(page.getByTestId('canton-overview')).toBeVisible();
    await expect(page.locator('.canton-overview-list')).toBeVisible();
  });

  test('outside-Switzerland warning does not affect overview rendering', async ({ page }) => {
    // The overview renders independently of any map interaction
    // Simply confirm it is fully visible without any location selected
    await expect(page.getByTestId('canton-overview')).toBeVisible();
    await expect(page.locator('[data-testid^="canton-card-"]')).toHaveCount(26);

    // Navigate away and back to confirm the overview re-renders correctly
    await page.getByTestId('nav-sessions').click();
    await page.getByTestId('nav-laws').click();
    await expect(page.getByTestId('canton-overview')).toBeVisible();
  });
});
