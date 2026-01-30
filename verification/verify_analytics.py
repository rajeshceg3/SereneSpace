from playwright.sync_api import sync_playwright

def verify_analytics():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(msg.text))

        try:
            print("Navigating to http://localhost:5173")
            page.goto("http://localhost:5173")
            page.wait_for_timeout(5000)

            # Check for initialization log
            init_log = any("[Analytics] Initialized Console Provider" in log for log in console_logs)
            if init_log:
                print("SUCCESS: Analytics initialized.")
            else:
                print("FAILURE: Analytics initialization log not found.")

            # Check for Session Started track
            track_log = any("[Analytics] Track: Session Started" in log for log in console_logs)
            if track_log:
                print("SUCCESS: Session Started event tracked.")
            else:
                print("FAILURE: Session Started event NOT tracked.")

            if not init_log or not track_log:
                print("Logs:", console_logs)

            page.screenshot(path="verification/analytics_load.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_analytics()
