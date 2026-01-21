import { test, expect } from '@playwright/test';

test('core user journey', async ({ page }) => {
  test.setTimeout(20000); // Increase timeout further

  // Listen for any console errors in the browser
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Browser console error: ${msg.text()}`);
    }
  });

  await page.goto('/');
  await page.waitForSelector('canvas', { state: 'visible', timeout: 10000 });

  // Scroll to the second destination
  await page.mouse.wheel(0, 1000);

  // Give animations time to play out
  await page.waitForTimeout(2000);

  // Take a screenshot for debugging before the assertion
  await page.screenshot({ path: 'e2e-debug-screenshot.png' });

  // Wait for the text to appear
  await expect(page.getByText('Kyoto')).toBeVisible({ timeout: 10000 });

  // click on it
  await page.getByText('Kyoto').click();

  // and then the description
  await expect(page.getByText('The cultural heart of Japan, known for its beautiful temples, gardens, and traditional wooden houses.')).toBeVisible({ timeout: 10000 });

  // Scroll back
  await page.mouse.wheel(0, -1000);
  await expect(page.getByText('Kyoto')).not.toBeVisible({ timeout: 10000 });
});
