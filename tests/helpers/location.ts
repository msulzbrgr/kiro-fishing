import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

interface MockLocationResult {
  display_name: string;
  address: {
    state?: string;
    city?: string;
    country?: string;
    country_code?: string;
  };
}

async function selectLocation(page: Page, result: MockLocationResult, expectedText: string) {
  await page.route('https://nominatim.openstreetmap.org/reverse**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(result),
    });
  });
  await page.getByTestId('select-location-btn').click();
  await expect(page.getByTestId('map-container')).toBeVisible();
  await page.getByTestId('map-container').click({ position: { x: 240, y: 200 } });
  await expect(page.locator('.location-info').first()).toContainText(expectedText);
}

export async function selectSwissLocation(page: Page) {
  await selectLocation(
    page,
    {
      display_name: 'Zürich, Schweiz',
      address: {
        state: 'Zürich',
        city: 'Zürich',
        country: 'Switzerland',
        country_code: 'ch',
      },
    },
    'Zürich',
  );
  await expect(page.locator('.canton-badge').first()).toContainText('Zürich');
}

export async function selectFinnishLocation(page: Page) {
  await selectLocation(
    page,
    {
      display_name: 'Helsinki, Finland',
      address: {
        state: 'Uusimaa',
        city: 'Helsinki',
        country: 'Finland',
        country_code: 'fi',
      },
    },
    'Helsinki',
  );
}
