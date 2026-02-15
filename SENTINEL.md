# Sentinel Mk.II: Neuro-Adaptive Defense Grid

## Overview
The **Sentinel Defense Grid** is an active cognitive protection system that evolved from the passive `SentinelSystem`. Unlike the original protocol switcher (which only changed environmental variables like fog and light), the Defense Grid proactively deploys "Counter-Measures" to neutralize specific stress signatures.

## Core Architecture

### 1. Threat Analyzer (`src/services/ThreatAnalyzer.ts`)
A specialized predictive engine that analyzes the user's stress history (via `ResonanceStore`) to detect specific threat signatures:
- **ACUTE STRESS (Panic Spike):** Rapid velocity increase (> 0.2 units/sec).
- **CHRONIC STRESS (Sustained):** Stress > 0.6 for > 5 seconds.
- **OPTIMAL:** Low stress, low variance.

### 2. Threat Levels
Based on the signature, the system assigns a DEFCON-like threat level:
- **SAFE:** Normal operation. Transparent overlay.
- **CAUTION:** Slight stress rise. Subtle vignette.
- **WARNING:** Acute spike or onset of chronic stress. Heavy vignette, partial desaturation.
- **CRITICAL:** Panic attack or extreme sustained stress. Tunnel vision, near-monochrome.

### 3. Counter-Measures
The system automatically deploys interventions via `AudioEngine` and `DefenseOverlay`:

| Threat Level | Visual Counter-Measure | Audio Counter-Measure | Intent |
|--------------|------------------------|-----------------------|--------|
| **WARNING**  | Vignette (30%) + Desat (20%) | **PATTERN_INTERRUPT** | Break the focus loop using pulsing Pink Noise and Binaural Sweeps. |
| **CRITICAL** | Vignette (90%) + Desat (90%) | **GROUNDING** | Force stabilization using massive Brown Noise and Sub-bass Drone (55Hz). |

## Implementation Details
- **State Management:** `useSentinelStore` now tracks `threatLevel` and `activeCounterMeasures`.
- **Component:** `SentinelDefenseSystem` replaces `SentinelSystem`. It runs the `ThreatAnalyzer` loop at 2Hz.
- **Visuals:** `DefenseOverlay` provides a global CSS-based HUD that bypasses the 3D canvas for maximum performance and reliability.
- **Audio:** `AudioEngine` includes a high-priority `interventionMode` that overrides standard narrative mixing.

## Usage
The system is fully autonomous. No user configuration is required. It activates automatically when bio-feedback (simulated or real) indicates cognitive distress.
