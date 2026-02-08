from playwright.sync_api import sync_playwright

def verify(page):
    print("Navigating...")
    page.goto("http://localhost:4173")

    print("Waiting for app...")
    page.wait_for_selector('[data-testid="app-container"]', timeout=30000)

    # Wait for Fade In
    page.wait_for_timeout(3000)

    print("Pressing H...")
    page.keyboard.press("h")

    print("Waiting for TACTICAL FORECAST...")
    page.wait_for_selector("text=TACTICAL FORECAST", timeout=5000)

    print("Taking screenshot...")
    page.screenshot(path="verification_aegis.png")
    print("Done.")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify(page)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="error.png")
    finally:
        browser.close()
