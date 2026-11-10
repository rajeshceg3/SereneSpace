---
name: verify-serene-space
description: Verifies SereneSpace (Stillness) - production build, the full vitest suite, and the Playwright journeys in real Chromium - with machine-readable evidence.
---

# Verify SereneSpace

## Launch

```bash
python3 .cursor/skills/verify-serene-space/verify.py
```

Exit 0 and `FAILURES=0` mean green. Full run takes about two minutes.

## Doctor

Gates on `npm`. Runs `npm ci` when node_modules is absent and
`npx playwright install chromium` when the browser cache is missing.

## Drive

1. `npm run build` - `tsc -b && vite build`.
2. `npx vitest run` - the unit/component suite (217 tests).
3. `npx playwright test` - the e2e journeys in real Chromium,
   self-served on port 4173.

## Evidence

Each run writes a fresh `EVIDENCE_DIR` with `evidence.json`.
`FAILURES=n` is the last line; the exit code mirrors it.

## Maintenance

The suites are the app's own; new specs are picked up automatically.
