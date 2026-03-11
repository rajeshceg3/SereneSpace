from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--use-gl=swiftshader"])
        page = browser.new_page()

        # Navigate to the preview server
        page.goto("http://localhost:4173")

        # Wait for cinematic entry to complete (5s animation)
        page.wait_for_timeout(6000)

        # Take a screenshot of the initial load state (Cinematic Entry & Discovery Cue)
        page.screenshot(path="verification_initial.png")

        # Move mouse to trigger hover hint
        # Assuming the first destination is around the center, slightly offset
        viewport_size = page.viewport_size
        if viewport_size:
            page.mouse.move(viewport_size["width"] / 2, viewport_size["height"] / 2)
            page.wait_for_timeout(1000) # Wait for hover hint animation

        # Take a screenshot showing the Hover Hint
        page.screenshot(path="verification_hover.png")

        # Click to trigger Destination Details
        if viewport_size:
            page.mouse.click(viewport_size["width"] / 2, viewport_size["height"] / 2)
            # Wait for Name and Details reveal animations (Name: 1.8s + Details: 1.5s delayed)
            page.wait_for_timeout(4000)

        # Take a screenshot showing Destination Details
        page.screenshot(path="verification_details.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
