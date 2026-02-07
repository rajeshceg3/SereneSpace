import { test } from '@playwright/test';
import { ExperiencePage } from '../pages/ExperiencePage';

test.describe('User Journey', () => {
  test('Navigate between destinations', async ({ page }) => {
    test.slow();
    const experience = new ExperiencePage(page);
    await experience.goto();

    // 1. Initial State: Paris
    await experience.expectTextVisible('Paris');

    // 2. Navigate to Next: Kyoto
    await experience.navigateNext();

    try {
        await experience.expectTextVisible('Kyoto');
    } catch (e) {
        console.log('DEBUG: Navigation Failed. Page Content:');
        console.log(await page.content());
        throw e;
    }

    // 3. Navigate to Next: Iceland
    await experience.navigateNext();
    await experience.expectTextVisible('Iceland');

    // 4. Navigate Back: Kyoto
    await experience.navigatePrevious();
    await experience.expectTextVisible('Kyoto');
  });
});
