import { useEffect, useRef } from 'react';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useDestinationStore } from '../stores/useDestinationStore';
import { useTelemetryStore } from '../stores/useTelemetryStore';

export const TelemetryRecorder = () => {
  // Use refs to avoid re-subscribing, though Zustand state is stable usually.
  // We access stores directly via getState() inside the interval to avoid re-renders.

  const activeDestination = useDestinationStore((state) => state.activeDestination);
  const prevDestinationRef = useRef<string | null>(activeDestination);

  // 1. Periodic Sampling (1Hz)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const stress = useResonanceStore.getState().currentStress;
      useTelemetryStore.getState().logSample(stress);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // 2. Event Logging (Destination Changes)
  useEffect(() => {
    if (activeDestination !== prevDestinationRef.current) {
        const stress = useResonanceStore.getState().currentStress;
        // Only log if it's not the initial null -> value transition (unless we want that)
        // Let's log all changes for now.
        if (activeDestination) {
             useTelemetryStore.getState().logEvent(`Arrived: ${activeDestination}`, stress);
        }
        prevDestinationRef.current = activeDestination;
    }
  }, [activeDestination]);

  return null; // Headless component
};
