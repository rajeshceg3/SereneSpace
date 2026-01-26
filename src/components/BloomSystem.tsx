import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useDestinationStore } from './../stores/useDestinationStore';
import { useResonanceStore } from './../stores/useResonanceStore';
import { useBloomStore } from './../stores/useBloomStore';
import { BLOOM_STRESS_THRESHOLD, FOCUS_TIME_TO_BLOOM } from '../constants';

// A headless component to manage the "bloom" state of destinations
// Implements the Bloom System: A reward mechanism for calm focus.
export const BloomSystem = () => {
  const focusTimeRef = useRef(0);
  const lastActiveDestinationRef = useRef<string | null>(null);

  useFrame((_, delta) => {
    const { activeDestination } = useDestinationStore.getState();
    const { currentStress } = useResonanceStore.getState();
    const { bloomedDestinations, setBloomed } = useBloomStore.getState();

    // Reset focus time if the active destination changes
    if (activeDestination !== lastActiveDestinationRef.current) {
      focusTimeRef.current = 0;
      lastActiveDestinationRef.current = activeDestination;
    }

    // If there's an active destination and it hasn't bloomed yet
    if (activeDestination && !bloomedDestinations[activeDestination]) {
      // Check if the user is in a calm state
      if (currentStress < BLOOM_STRESS_THRESHOLD) {
        focusTimeRef.current += delta;
      } else {
        // Reset focus time if stress exceeds the threshold
        focusTimeRef.current = 0;
      }

      // If the focus time is sufficient, trigger the bloom
      if (focusTimeRef.current >= FOCUS_TIME_TO_BLOOM) {
        setBloomed(activeDestination);
        focusTimeRef.current = 0; // Reset after blooming
      }
    }
  });

  return null;
};
