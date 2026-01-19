# Progress Report - Stillness

## 1. Executive Summary & Product Overview
- [ ] 1.1 Product Vision
- [ ] 1.2 Problem Statement
- [ ] 1.3 Target Users
- [ ] 1.4 Success Metrics (KPIs)

## 2. Functional Requirements
### 2.1 User Stories
- [ ] 1. Enter experience instantly (no friction)
- [ ] 2. Explore destinations spatially
- [ ] 3. Subtle feedback to actions
- [ ] 4. Minimal UI

### 2.2 Feature Specifications
#### Feature 1: Ambient Landing Experience
- [x] App loads
- [x] Scene fades in from black (800–1200ms)
- [x] Ambient motion begins automatically (Camera parallax, Light shift, Slow object rotation)
- [x] Edge Cases: Low-power devices → reduced motion mode
- [x] Edge Cases: WebGL unsupported → fallback static page

#### Feature 2: Spatial Destination Exploration
- [x] Destinations as floating 3D objects
- [x] Scroll → camera gently advances
- [x] Destination comes into focus
- [x] Name appears softly
- [x] User pauses → detail layer fades in
- [x] Logic: Only one destination active at a time
- [x] Logic: UI auto-hides after 2s inactivity
- [ ] Error Handling: Asset load failure → graceful placeholder

#### Feature 3: Invisible Navigation Layer
- [ ] No persistent navbar
- [ ] Navigation hints fade in only when needed
- [ ] Keyboard navigation supported

### 2.3 UI / UX Requirements
- [ ] Full-screen canvas
- [ ] Zero visible borders
- [ ] Typography overlays only when contextually required
- [ ] Scroll = forward/back
- [ ] Hover = reveal
- [ ] Click = deepen focus
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Accessibility: Reduced motion toggle
- [ ] Accessibility: Keyboard traversal
- [ ] Accessibility: Screen reader fallback descriptions

## 3. Technical Requirements
- [x] React 18
- [x] Three.js r160
- [x] State: Zustand
- [x] Styling: CSS + custom shaders
- [x] Build: Vite
- [ ] First render ≤ 2.5s
- [ ] Frame rate ≥ 50 FPS

## 4. Database Design
- [x] Static JSON for Destinations

## 5. API Specifications
- [ ] None for Phase 1

## 6. Development Guidelines
- [ ] Functional components only
- [ ] No inline magic numbers
- [ ] Explicit animation timing constants

## 7. Deployment & Infrastructure
- [x] CI via GitHub Actions (Lint, Build, Deploy)
- [x] Deployment target: GitHub Pages
- [x] Base path configuration for portability

## 8. Quality Assurance
- [x] No console errors (Linting clean)
- [ ] FPS ≥ target
- [ ] Reduced motion verified
- [ ] Lighthouse ≥ 85
