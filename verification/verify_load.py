from playwright.sync_api import sync_playwright

def verify_app_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:4173...")
            page.goto("http://localhost:4173")

            # Wait for potential lazy load
            print("Waiting for load...")
            page.wait_for_timeout(5000)

            path = "verification/app_load.png"
            page.screenshot(path=path)
            print(f"Screenshot taken at {path}")

            # Log title
            print(f"Page title: {page.title()}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_load()
