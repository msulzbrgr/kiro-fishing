import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function selectSwissLocation(page: Page) {
  await page.route('https://nominatim.openstreetmap.org/reverse**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        display_name: 'Zürich, Schweiz',
        address: {
          state: 'Zürich',
          city: 'Zürich',
          country_code: 'ch',
        },
      }),
    });
  });
  await page.getByTestId('select-location-btn').click();
  await expect(page.getByTestId('map-container')).toBeVisible();
  await page.getByTestId('map-container').click({ position: { x: 240, y: 200 } });
  await expect(page.locator('.canton-badge').first()).toContainText('Zürich');
}
