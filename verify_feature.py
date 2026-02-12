from playwright.sync_api import sync_playwright
import time

def verify_neural_atlas():
    with sync_playwright() as p:
        # Use SwiftShader for headless WebGL support
        browser = p.chromium.launch(
            headless=True,
            args=['--use-gl=swiftshader']
        )
        page = browser.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:4173")

            # Wait for app to load (fade in)
            print("Waiting for app load...")
            page.wait_for_selector('canvas', state='visible', timeout=20000)
            time.sleep(5) # Wait for fade in and initial render

            # 1. Verify Aegis HUD text
            print("Pressing H to open HUD...")
            page.keyboard.press('h')
            time.sleep(1)

            print("Taking screenshot of HUD...")
            page.screenshot(path="verification_aegis.png")

            # Check for text "[M] NEURAL ATLAS"
            content = page.content()
            if "[M] NEURAL ATLAS" in content:
                print("SUCCESS: Found '[M] NEURAL ATLAS' in HUD.")
            else:
                print("FAILURE: Did not find '[M] NEURAL ATLAS' in HUD.")

            # 2. Verify Atlas Overlay
            print("Pressing M to open Atlas...")
            page.keyboard.press('m')
            time.sleep(2) # Wait for render

            print("Taking screenshot of Atlas...")
            page.screenshot(path="verification_atlas.png")

            # Check for "NEURAL ATLAS" title in overlay
            if "NEURAL ATLAS" in page.content():
                print("SUCCESS: Found 'NEURAL ATLAS' title in overlay.")
            else:
                 print("FAILURE: Did not find 'NEURAL ATLAS' title in overlay.")

            # Check for "CLOSE ATLAS" button
            if "CLOSE ATLAS" in page.content():
                 print("SUCCESS: Found 'CLOSE ATLAS' button.")
            else:
                 print("FAILURE: Did not find 'CLOSE ATLAS' button.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_neural_atlas()
