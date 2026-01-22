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

  // Wait for the canvas to be present in the DOM. This is a more reliable
  // indicator that the app has loaded than checking for CSS opacity.
  await page.waitForSelector('canvas', { state: 'attached', timeout: 15000 });

  // Scroll to the second destination by dispatching a wheel event.
  // This is more reliable in a headless environment where mouse simulation
  // on a non-rendered canvas can be flaky.
  await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })));

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
