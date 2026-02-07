import { test, expect } from '@playwright/test';
import { ExperiencePage } from '../pages/ExperiencePage';

test.describe('Smoke Test', () => {
  test('Application loads and renders canvas', async ({ page }) => {
    // Print all console logs
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERROR: ${err}`));

    const experience = new ExperiencePage(page);
    await experience.goto();

    // Verify canvas is present
    await expect(experience.canvas).toBeAttached();

    // Check WebGL status
    const webGLStatus = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    });
    console.log('DEBUG: WebGL Supported:', webGLStatus);

    // Verify initial destination text appears (Paris)
    try {
        await experience.expectTextVisible('Paris');
    } catch (e) {
        console.log('DEBUG: Smoke Test Failed. Page Content Dump:');
        console.log(await page.content());
        if (await page.locator('.fallback-container').count() > 0) {
            console.log('DEBUG: Fallback container found (WebGL missing or other error)');
        }
        throw e;
    }

    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForTimeout(1000);

    // Ignore harmless 404s for favicon or similar if any, and React 18 HMR warnings
    const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('ReactDOMClient.createRoot')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
