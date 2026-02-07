# Elite Test Strategy

This document outlines the testing infrastructure designed to ensure functional correctness, regression safety, and deployment confidence for the "Stillness" application.

## 1. Testing Pyramid

We adhere to a classic testing pyramid structure, balanced for a 3D interactive application.

### 1.1. Unit Tests (Base Layer)
*   **Purpose:** Verify pure logic, state management, and service isolation.
*   **Tools:** Vitest, React Testing Library.
*   **Coverage Target:** >80% (Lines, Functions, Branches).
*   **Scope:**
    *   **Stores (Zustand):** `useDestinationStore`, `useAudioStore`, etc.
    *   **Services:** `AudioEngine`, `Cartographer`, `RespirationController`.
    *   **Components:** Isolated component rendering and logic.
*   **Key Concept:** External dependencies (Web Audio API, Three.js internals) are heavily mocked to ensure determinism and speed.

### 1.2. Integration Tests (Middle Layer)
*   **Purpose:** Verify the interaction between multiple modules, specifically the critical loops.
*   **Tools:** Vitest, `@react-three/test-renderer`.
*   **Scope:**
    *   **Audio-Visual Loop:** Verifying that `AudioEngine` time updates correctly drive the `EntrainmentSystem` visual pulse.
    *   **Store-Component Binding:** Verifying that store updates trigger correct component re-renders.

### 1.3. End-to-End (E2E) Tests (Top Layer)
*   **Purpose:** Verify the complete user journey in a real browser environment (Headless Chromium).
*   **Tools:** Playwright.
*   **Scope:**
    *   **Smoke Test:** Application loads, Canvas renders (WebGL presence), critical error checking.
    *   **Navigation:** User can move between destinations via keyboard.
*   **Strategy:**
    *   **Production Build:** Tests run against `npm run build && npm run preview` to match production artifacts and avoid HMR instability.
    *   **Visual Strictness:** We verify that text elements (`.destination-name`) actually appear in the DOM, proving that the 3D scene state has correctly triggered the UI overlay.
    *   **Determinism:** We prefer programmatic inputs (Keyboard Events) over simulation of physics (Scroll) for reliability in CI.

## 2. CI/CD Pipeline (`.github/workflows/quality-gate.yml`)

Every Pull Request and Push to Main triggers the Quality Gate:

1.  **Validation Job:**
    *   Linting (`eslint`).
    *   Type Checking (`tsc -b`). **Zero tolerance for type errors.**

2.  **Unit Test Job:**
    *   Runs `vitest --coverage`.
    *   Enforces 80% coverage thresholds.
    *   Uploads coverage report.

3.  **E2E Test Job:**
    *   Depends on successful Unit Tests.
    *   Installs Playwright dependencies.
    *   Builds the application (`npm run build`).
    *   Runs Playwright against the local production server.
    *   Uploads artifacts (videos, traces) on failure.

## 3. Developer Workflow

### Running Tests Locally

*   **Unit Tests:** `npm run test`
*   **Coverage:** `npm run test:coverage`
*   **E2E Tests:** `npm run test:e2e` (Requires build)
*   **Full CI Check:** `npm run test:ci`

### Debugging E2E

If E2E tests fail:
1.  Check the `playwright-report/` folder.
2.  Run `npx playwright show-report`.
3.  Check console logs in the output for "BROWSER ERROR" or "Context Lost".

## 4. Architecture Decisions

*   **WebGL in CI:** We explicitly enable SwiftShader (`--use-gl=swiftshader`) and unsafe fallbacks to ensure the 3D canvas can initialize in headless CI runners without a physical GPU.
*   **Mocking:** We mock `window.matchMedia`, `ResizeObserver`, and complex Web Audio nodes (`AudioContext`, `GainNode`) in Vitest setup to allow testing logic without browser APIs.
*   **HMR Avoidance:** We found that Vite's HMR can cause "Unmounted Root" errors in automated browser testing. Running against a built preview server eliminates this class of flake.
