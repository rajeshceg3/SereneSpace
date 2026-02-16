from playwright.sync_api import sync_playwright
import time

def run(playwright):
    print("Launching browser...")
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        print("Navigating...")
        page.goto("http://localhost:5173", wait_until='domcontentloaded')

        # Wait for initial load
        print("Waiting for initial load...")
        time.sleep(5)

        # Induce Stress
        print("Inducing Stress...")
        # Keypress impact 0.05. Decay 0.005. Net gain 0.045 per press.
        # Target 0.9. Need ~20 presses rapidly.
        for _ in range(50):
            page.keyboard.press("Space")
            time.sleep(0.05) # 20Hz

        print("Waiting for Defense System activation...")
        time.sleep(3)

        # Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification_defense.png")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
