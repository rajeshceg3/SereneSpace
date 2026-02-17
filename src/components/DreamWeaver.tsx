import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useResonanceStore } from '../stores/useResonanceStore';
import { usePredictionStore } from '../stores/usePredictionStore';
import { useNarrativeStore } from '../stores/useNarrativeStore';
import { useTelemetryStore } from '../stores/useTelemetryStore'; // Added import
import { useRespirationStore } from '../stores/useRespirationStore';
import { narrativeEngine } from '../services/NarrativeEngine';
import { audioEngine } from '../services/AudioEngine';

export const DreamWeaver = () => {
  const setArc = useNarrativeStore((state) => state.setArc);
  const setIntensity = useNarrativeStore((state) => state.setIntensity);
  const currentArc = useNarrativeStore((state) => state.currentArc);

  const lastUpdate = useRef(0);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    // Update logic every 1s
    if (now - lastUpdate.current > 1.0) {
      const stress = useResonanceStore.getState().currentStress;
      const { stressVelocity } = usePredictionStore.getState();

      // Calculate average coherence from session history
      const history = useTelemetryStore.getState().history;
      const coherence = history.length > 0
        ? history.reduce((acc, curr) => acc + curr.coherenceScore, 0) / history.length
        : 80; // Default baseline for new users

      // Get real-time breath coherence
      const breathCoherence = useRespirationStore.getState().coherence;

      const result = narrativeEngine.determineArc(currentArc, stress, stressVelocity, coherence, breathCoherence);

      if (result.arc !== currentArc) {
          setArc(result.arc);
      }
      setIntensity(result.intensity);

      // Notify audio engine directly
      audioEngine.updateNarrative(result.arc, result.intensity);

      lastUpdate.current = now;
    }
  });

  return null;
};
