from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=[
            '--use-gl=swiftshader',
            '--ignore-gpu-blocklist',
            '--enable-webgl',
            '--use-angle=swiftshader'
        ])
        page = browser.new_page()
        page.goto('http://localhost:4173/')
        print("Waiting for page load...")
        time.sleep(10)
        page.screenshot(path='/home/jules/verification/stillness_loaded_3.png')
        print("Captured screenshot!")
        browser.close()

run()
