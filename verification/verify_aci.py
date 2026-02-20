from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-gl=swiftshader'])
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        try:
            page.goto("http://localhost:4173")

            # Wait for app to load
            print("Waiting for app-container...")
            page.wait_for_selector('[data-testid="app-container"]', state="visible", timeout=60000)
            print("App loaded.")

            # Wait a bit more for fade in
            page.wait_for_timeout(3000)

            # Press Shift+A to toggle ACI
            print("Pressing Shift+A...")
            page.keyboard.press("Shift+A")

            # Wait for ACI to appear
            print("Waiting for ACI...")
            page.wait_for_selector(".aetheric-command-interface", state="visible", timeout=10000)
            print("ACI visible.")

            # Take screenshot (Dashboard)
            page.screenshot(path="verification/aci_visible.png")
            print("Screenshot: aci_visible.png")

            # Click Mixer Tab
            print("Clicking MIXER...")
            page.click("text=MIXER")
            page.wait_for_timeout(500)
            page.screenshot(path="verification/aci_mixer.png")
            print("Screenshot: aci_mixer.png")

            # Click Protocols Tab
            print("Clicking PROTOCOLS...")
            page.click("text=PROTOCOLS")
            page.wait_for_timeout(500)
            page.screenshot(path="verification/aci_protocols.png")
            print("Screenshot: aci_protocols.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
