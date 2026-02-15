import { test, expect } from '@playwright/test';

test('verify defense overlay', async ({ page }) => {
  // Use localhost:5173 directly as the dev server is running there
  await page.goto('http://localhost:5173');

  // Wait for load (Canvas initialization)
  await page.waitForTimeout(5000);

  // Induce stress
  console.log('Inducing stress...');
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
  }

  console.log('Waiting for overlay...');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'verification_defense.png' });
});
