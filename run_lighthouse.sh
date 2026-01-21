#!/bin/bash
export CHROME_PATH=/home/jules/.cache/ms-playwright/chromium-1200/chrome-linux/chrome
lighthouse http://localhost:5173 --output=json --output-path=./lighthouse-report.json --chrome-flags='--headless --no-sandbox' --only-categories=performance,accessibility,best-practices,seo
