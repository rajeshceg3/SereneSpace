import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEntrainmentStore } from '../stores/useEntrainmentStore';
import { ENTRAINMENT_CONFIG } from '../constants';
import { audioEngine } from '../services/AudioEngine';

export const EntrainmentSystem = () => {
  useFrame((state) => {
    const {
      targetFreq,
      currentFreq,
      isActive,
      updateCurrentFreq,
      updatePulse
    } = useEntrainmentStore.getState();

    if (!isActive) {
      if (currentFreq !== 0) updatePulse(0);
      return;
    }

    // Smoothly transition frequency
    const newFreq = THREE.MathUtils.lerp(
      currentFreq,
      targetFreq,
      ENTRAINMENT_CONFIG.PULSE_SMOOTHING
    );
    updateCurrentFreq(newFreq);

    // Calculate pulse (Sine wave 0 to 1)
    // sin(time * freq * 2PI) -> -1 to 1
    // mapped to 0 to 1
    // Cross-Modal Synesthesia: Use audio time if available for perfect sync
    const time = audioEngine.getCurrentTime() || state.clock.getElapsedTime();
    const sineValue = Math.sin(time * newFreq * Math.PI * 2);
    const pulseValue = (sineValue + 1) / 2;

    updatePulse(pulseValue);
  });

  return null;
};
