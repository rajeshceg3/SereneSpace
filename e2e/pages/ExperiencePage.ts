import { type Page, type Locator, expect } from '@playwright/test';

export class ExperiencePage {
  readonly page: Page;
  readonly canvas: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = page.locator('canvas');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForCanvas();
  }

  async waitForCanvas() {
    // Wait for canvas to be attached and have some time to init
    await this.canvas.waitFor({ state: 'attached', timeout: 30000 });
    // Additional wait for R3F to likely render first frame
    await this.page.waitForTimeout(1000);
  }

  async initAudio() {
    const button = this.page.getByRole('button', { name: /INIT AUDIO|MUTE/i });
    if (await button.isVisible()) {
        const text = await button.textContent();
        if (text?.includes('INIT')) {
            await button.click();
        }
    } else {
        // Press M as fallback if UI isn't visible yet
        await this.page.keyboard.press('m');
    }
  }

  async toggleMute() {
     await this.page.keyboard.press('m');
  }

  async scrollToNext() {
    await this.page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: 250 })));
    await this.page.waitForTimeout(2000); // Wait for transition
  }

  async scrollToPrevious() {
    await this.page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel', { deltaY: -250 })));
    await this.page.waitForTimeout(2000);
  }

  async navigateNext() {
    await this.page.keyboard.press('ArrowRight');
    // Allow time for camera lerp and UI reveal
    await this.page.waitForTimeout(1000);
  }

  async navigatePrevious() {
    await this.page.keyboard.press('ArrowLeft');
    await this.page.waitForTimeout(1000);
  }

  async clickDestination(name: string) {
    const label = this.page.getByText(name, { exact: true });
    await expect(label).toBeVisible({ timeout: 5000 });
    await label.click();
  }

  async expectTextVisible(text: string) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 10000 });
  }

  async expectAudioInitialized() {
      // Check button text changes to MUTE or UNMUTE
      await expect(this.page.getByRole('button', { name: /MUTE/i })).toBeVisible();
      const text = await this.page.getByRole('button', { name: /MUTE/i }).textContent();
      expect(text).not.toContain('INIT');
  }
}
