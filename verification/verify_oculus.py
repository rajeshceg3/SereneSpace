import time
from playwright.sync_api import sync_playwright

def verify_oculus():
    with sync_playwright() as p:
        # Use SwiftShader for 3D compatibility in headless mode if needed,
        # though we are just testing UI overlay here.
        browser = p.chromium.launch(headless=True, args=['--use-gl=swiftshader'])
        page = browser.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:4173")

            # Wait for app container to fade in
            print("Waiting for app container...")
            page.wait_for_selector('[data-testid="app-container"]', state="visible", timeout=30000)

            # Wait a bit for initialization
            time.sleep(2)

            print("Pressing 'O' to toggle Oculus Interface...")
            page.keyboard.press("o")

            # Wait for overlay
            print("Waiting for Oculus overlay...")
            page.wait_for_selector(".oculus-overlay", state="visible", timeout=5000)

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/oculus_interface.png")
            print("Screenshot saved to verification/oculus_interface.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_oculus()
