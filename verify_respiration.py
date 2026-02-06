from playwright.sync_api import sync_playwright, expect
import time

def verify_respiration_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant microphone permission
        context = browser.new_context(permissions=["microphone"])
        page = context.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Wait for app to load (canvas etc)
            print("Waiting for load...")
            page.wait_for_timeout(5000)

            # Check for Init Audio overlay and click it
            init_btn = page.locator("div[role='button']", has_text="INIT AUDIO")
            if init_btn.is_visible():
                print("Clicking Init Audio...")
                init_btn.click()
                page.wait_for_timeout(1000) # Wait for fade out

            # Find the Respiration Toggle button (STANDBY)
            print("Looking for toggle...")
            toggle_btn = page.locator(".respiration-toggle")
            expect(toggle_btn).to_be_visible()

            # Click to Engage
            print("Clicking toggle...")
            toggle_btn.click()

            # Wait for panel to appear
            print("Waiting for panel...")
            panel = page.locator(".respiration-panel")
            expect(panel).to_be_visible()

            # Check for Mode buttons
            print("Checking mode buttons...")
            mic_btn = page.locator("button.mode-btn", has_text="MIC")
            expect(mic_btn).to_be_visible()

            # Click MIC
            print("Clicking MIC...")
            mic_btn.click()

            # Check for BIO-SYNC LINKED text
            print("Verifying text...")
            phase_text = page.locator(".respiration-phase")
            expect(phase_text).to_have_text("BIO-SYNC LINKED")

            # Screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification_respiration.png")
            print("Screenshot saved to verification_respiration.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_respiration_ui()
