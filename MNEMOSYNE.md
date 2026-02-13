# Mnemosyne: The River of Memory

## Overview
"The Mnemosyne Stream" (Feature 22) is a transformative narrative and environmental feature that visualizes the user's past journeys as glowing, ethereal streams flowing through the infinite landscape. Named after the Greek goddess of memory, this system turns the user's own history into a tangible part of the world.

## Architecture

### 1. Telemetry Persistence (`src/stores/useTelemetryStore.ts`)
- **Mechanism:** Records the user's spatial path (`x, y, z`) along with stress and coherence metrics.
- **Storage:** Persists the last 10 session paths in `localStorage` under `telemetry_history`.
- **Optimization:** Paths are sampled at 5Hz to balance detail and performance.

### 2. Visual Layer (`src/components/MnemosyneStream.tsx`)
- **Geometry:** Generates `TubeGeometry` based on `CatmullRomCurve3` splines derived from historical path data.
- **Shader:** Uses a custom `StreamShader` (`src/shaders/stream.ts`) that animates UVs to create a flowing, liquid light effect.
- **Aesthetic:** The stream glows cyan/teal and pulses with time, fading at the edges to resemble a spirit ribbon.

### 3. Audio Layer (`src/services/AudioEngine.ts`)
- **Sonification:** Introduces a "Mnemosyne Layer" consisting of a filtered Sawtooth wave modulated by a slow LFO (Bandpass sweep) to create a "singing wind" or "shimmer" texture.
- **Modulation:** The volume of this layer is inversely proportional to the distance between the user and the nearest stream point.

### 4. Passive Entrainment (Interaction)
- **Mechanic:** Proximity to the stream (< 5 units) triggers a "Passive Calm" effect, accelerating the decay of user stress (`decayStress(0.01)` per frame).
- **Narrative:** Following one's own "path of coherence" from the past helps stabilize the present.

## Technical Notes
- **Performance:** The visual component samples history points (every 5th point) to reduce geometry complexity. Distance checks are performed every frame but optimized by checking control points.
- **Extensibility:** The shader can be enhanced to change color based on the recorded "coherence" of that specific path segment (e.g., Gold for high coherence, Blue for calm).
