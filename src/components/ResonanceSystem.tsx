import { useFrame } from '@react-three/fiber';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useBioLinkStore } from '../stores/useBioLinkStore';
import * as THREE from 'three';

// Force-include
export const ResonanceSystem = () => {
  const decayStress = useResonanceStore((state) => state.decayStress);
  const setStress = useResonanceStore((state) => state.setStress);

  useFrame((_state, delta) => {
    const { isConnected, hrv } = useBioLinkStore.getState();
    const currentStress = useResonanceStore.getState().currentStress;

    if (isConnected) {
      // Bio-Link Active: Stress is inversely proportional to HRV (Coherence)
      // Assumption: 100ms RMSSD is "perfect" calm (0 stress)
      // Assumption: 0ms RMSSD is "panic" (1 stress)
      // Clamp HRV contribution to prevent negative stress
      const targetStress = THREE.MathUtils.clamp(1.0 - (hrv / 100), 0, 1);

      // Smooth interpolation (lerp)
      const smoothedStress = THREE.MathUtils.lerp(currentStress, targetStress, delta * 2.0);
      setStress(smoothedStress);
    } else {
      // Standard Mode: Passive Decay
      decayStress();
    }
  });

  return null;
};
