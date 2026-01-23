# Chronos: Temporal Ambience System

## Overview
Chronos is a strategic enhancement that transforms "Stillness" from a static 3D viewer into a living, breathing environment. It synchronizes the application's atmospheric properties with the user's local time, deepening immersion and personalization.

## Architecture

### 1. TimeStore (`src/stores/useTimeStore.ts`)
- **Responsibility:** Tracks the current time phase based on the user's system clock.
- **Phases:**
  - `DAWN` (05:00 - 08:00)
  - `DAY` (08:00 - 17:00)
  - `DUSK` (17:00 - 20:00)
  - `NIGHT` (20:00 - 05:00)
- **Mechanism:** Updates via a 1-minute interval timer.

### 2. Atmosphere Component (`src/components/Atmosphere.tsx`)
- **Responsibility:** Renders the environmental elements (Lights, Fog, Background).
- **Mechanism:**
  - Subscribes to `useTimeStore`.
  - Uses `useFrame` to smoothly interpolate (lerp) values when the phase changes.
  - Manages `ambientLight`, `directionalLight`, and scene `background`/`fog`.

### 3. Configuration (`src/constants.ts`)
- `TIME_PHASES`: Defines the start/end hours for each phase.
- `ATMOSPHERE_CONFIG`: Defines the color palette and intensities for each phase.

## Usage
The system is fully autonomous. No user configuration is required. It respects the "calm" design philosophy by adapting implicitly.

## Extensibility
To add new phases or adjust colors, modify `src/constants.ts`. The system is designed to handle arbitrary phase definitions as long as the store logic supports them.
