# Resonance: Bio-Feedback System

## 1. Overview

Resonance is a core feature of the "Stillness" experience, designed to fulfill the product's primary vision: "Success means users leave the experience feeling calmer than when they arrived." It is a subtle, yet powerful, bio-feedback system that attunes the application's environment to the user's interaction patterns.

The system interprets rapid, high-intensity user inputs (e.g., fast scrolling, rapid keyboard navigation) as a proxy for a state of "stress." In response, it dynamically modulates the scene's atmosphere to create a more focused, enclosed, and intimate environment. As the user's interactions become calmer and more deliberate, the environment "opens up," becoming more expansive, bright, and serene.

This creates a symbiotic relationship between the user and the application, gently guiding them toward a more mindful mode of interaction and rewarding that calmness with a richer sensory experience.

## 2. Architecture

The Resonance System is comprised of three main components, working in a continuous feedback loop:

### 2.1. Input & Stress Generation (`src/components/UserInput.tsx`)

- **Responsibility:** Monitors user input events and quantifies them as "stress."
- **Mechanism:**
  - **Scroll Events:** The `handleWheel` function listens for mouse wheel events. The intensity of the scroll (`event.deltaY`) is measured, and a proportional amount of stress is added to the system via the `addStress` action. This value is clamped to prevent extreme spikes from single, erratic inputs.
  - **Keyboard Events:** The `handleKeyDown` function listens for `ArrowLeft` and `ArrowRight` key presses. Each navigation event adds a fixed amount of stress.
- **Output:** Calls the `addStress` function in the `useResonanceStore`.

### 2.2. State Management (`src/stores/useResonanceStore.ts`)

- **Responsibility:** Manages the application's `currentStress` state.
- **State:**
  - `currentStress`: A normalized value (0 to 1) representing the user's current interaction intensity.
- **Actions:**
  - `addStress(amount)`: Increases the `currentStress` value, capped at a maximum of 1.
  - `decayStress()`: Decreases the `currentStress` value over time, floored at a minimum of 0. This represents the "exhale" or the natural return to a state of calm.

### 2.3. Environmental Response (`src/components/Atmosphere.tsx`)

- **Responsibility:** Translates the `currentStress` state into visible, atmospheric changes.
- **Mechanism:**
  - This component subscribes to the `useResonanceStore`.
  - Inside the `useFrame` loop (which executes on every rendered frame), the `currentStress` value is used to modulate two key environmental parameters:
    - **Fog Density:** The density of the scene's fog is increased proportionally to the stress level (`targetConfig.fogDensity * (1 + stress * RESONANCE_FOG_MULTIPLIER)`). This creates a feeling of intimacy and focus when stress is high, and a sense of expansive openness when stress is low.
    - **Light Intensity:** The intensity of the ambient and directional lights is decreased proportionally to the stress level (`targetConfig.intensity * (1 - stress * RESONANCE_LIGHT_DIMMER)`). This subtly dims the world during periods of high-intensity interaction, further enhancing the sense of a narrowed focus.
- **Effect:** The result is a smooth, continuous, and almost subconscious feedback loop where the world itself seems to breathe in response to the user's actions.

### 2.4. Passive Decay (`src/components/ResonanceSystem.tsx`)

- **Responsibility:** Ensures the passive, continuous decay of stress over time.
- **Mechanism:**
  - This is a headless component that exists solely to call the `decayStress()` action on every frame via `useFrame`.
  - This ensures that if the user stops interacting, the system will naturally and gradually return to a baseline state of calm.

## 3. Strategic Importance

The Resonance System is the primary mechanism by which "Stillness" achieves its core product goal. It elevates the application from a passive 3D viewer into an active, responsive environment that participates in the user's journey toward a calmer state. It is a key differentiator and a foundational element of the application's unique value proposition.
