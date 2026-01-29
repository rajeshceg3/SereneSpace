from playwright.sync_api import sync_playwright
import time
import os

def verify_horizon(page):
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    # Wait for potential loading
    time.sleep(3)

    # Check if we are in fallback
    if page.locator(".no-webgl-fallback").count() > 0:
        print("WebGL Fallback detected. Cannot verify Horizon Indicator in full 3D context.")
    else:
        print("WebGL context active. Attempting to trigger stress...")

        # Simulate stress input (scroll) to trigger predictive model
        # We need consistent input to establish a trend for the regression model
        for i in range(5):
            page.mouse.wheel(0, 500)
            time.sleep(0.2)

        # Wait for model to process and UI to fade in
        time.sleep(2)

    os.makedirs("verification", exist_ok=True)
    output_path = "verification/horizon_indicator.png"
    page.screenshot(path=output_path)
    print(f"Screenshot saved to {output_path}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_horizon(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
