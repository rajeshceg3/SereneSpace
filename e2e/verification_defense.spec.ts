import { test } from '@playwright/test';

test('verify defense overlay', async ({ page }) => {
  test.setTimeout(120000);

  console.log('Navigating...');
  await page.goto('/');

  console.log('Waiting for load...');
  await page.waitForTimeout(15000); // Give it plenty of time

  // Take initial screenshot
  await page.screenshot({ path: 'verification_initial.png' });

  // Induce stress via JS evaluation (faster than CDP)
  console.log('Inducing stress via JS...');
  await page.evaluate(async () => {
    // Dispatch 100 space presses
    for (let i = 0; i < 100; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
        // Simulate frame delay? No, just spam it.
    }
  });

  console.log('Waiting for overlay reaction...');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'verification_defense.png' });
});
