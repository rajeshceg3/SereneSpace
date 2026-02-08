import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';

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

      useTelemetryStore.getState().logSpatialSample(x, y, z, stress);

      timeSinceLastSample.current = 0;
    }
  });

  return null;
};
