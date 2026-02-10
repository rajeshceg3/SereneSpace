import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { calculateCoherence } from '../utils/math';

const SAMPLE_RATE = 0.2; // Seconds between samples (5Hz)

export const SpatialTelemetryRecorder = () => {
  const { camera } = useThree();
  const timeSinceLastSample = useRef(0);

  useFrame((_, delta) => {
    timeSinceLastSample.current += delta;

    if (timeSinceLastSample.current >= SAMPLE_RATE) {
      // Access state directly to avoid re-renders of this component
      const stress = useResonanceStore.getState().currentStress;
      const { x, y, z } = camera.position;

      // Calculate coherence from recent history (last 20 samples)
      const recentData = useTelemetryStore.getState().sessionData.slice(-20);
      const values = recentData.map((d) => d.value);
      const coherence = calculateCoherence(values);

      useTelemetryStore.getState().logSpatialSample(x, y, z, stress, coherence);

      timeSinceLastSample.current = 0;
    }
  });

  return null;
};
