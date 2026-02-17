import type { NarrativeArc } from '../stores/useNarrativeStore';

export class NarrativeEngine {
  private static instance: NarrativeEngine;

  private constructor() {}

  public static getInstance(): NarrativeEngine {
    if (!NarrativeEngine.instance) {
      NarrativeEngine.instance = new NarrativeEngine();
    }
    return NarrativeEngine.instance;
  }

  // Pure logic function to determine next arc
  public determineArc(
    currentArc: NarrativeArc,
    stress: number,
    velocity: number, // Stress change per second
    sessionCoherence: number, // User's historical coherence (0-100)
    breathCoherence: number = 80 // New: Real-time breath coherence (0-100). Default to 80 (High) for backward compatibility
  ): { arc: NarrativeArc; intensity: number } {
    let nextArc = currentArc;
    let targetIntensity = 0;

    // Logic:
    // 1. High Stress Velocity -> Trigger DESCENT (Restoration)
    if (velocity > 0.1 && stress > 0.6) {
        return { arc: 'DESCENT', intensity: Math.min(1, stress + velocity) };
    }

    // 2. High Coherence + Low Stress -> Trigger ASCENSION (Exploration)
    // Requires both session coherence (history) and breath coherence (now)
    if (sessionCoherence > 70 && breathCoherence > 60 && stress < 0.2 && velocity < 0.01) {
        // Intensity is boosted by breath coherence
        const boost = (breathCoherence - 60) / 40; // 0 to 1
        return { arc: 'ASCENSION', intensity: Math.min(1, ((sessionCoherence - 70) / 30) + boost * 0.2) };
    }

    // 3. Very Low Stress + Zero Velocity -> Trigger STASIS (Deep Flow)
    if (stress < 0.1 && Math.abs(velocity) < 0.005) {
        return { arc: 'STASIS', intensity: 1.0 - stress };
    }

    // 4. Default: INITIATION (Baseline) if nothing else triggers
    // But maintain current arc if conditions are borderline to prevent flickering (Hysteresis)
    if (currentArc === 'ASCENSION') {
        // Dropping out of Ascension requires significant stress or loss of coherence
        if (stress > 0.4 || breathCoherence < 40) {
             nextArc = 'INITIATION';
        }
    } else if (currentArc === 'DESCENT' && stress < 0.3) {
        nextArc = 'INITIATION'; // Stabilized
    } else if (currentArc === 'STASIS' && stress > 0.2) {
        nextArc = 'INITIATION'; // Waking up
    }

    // Calculate intensity based on the active arc
    switch (nextArc) {
        case 'INITIATION':
            targetIntensity = 0;
            break;
        case 'ASCENSION':
            targetIntensity = (1 - stress); // Higher intensity when calmer
            break;
        case 'DESCENT':
            targetIntensity = stress; // Higher intensity when more stressed
            break;
        case 'STASIS':
            targetIntensity = 1.0;
            break;
    }

    // Clamp intensity
    targetIntensity = Math.max(0, Math.min(1, targetIntensity));

    return { arc: nextArc, intensity: targetIntensity };
  }
}

export const narrativeEngine = NarrativeEngine.getInstance();
