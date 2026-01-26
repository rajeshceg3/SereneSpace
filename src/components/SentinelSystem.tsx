import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import {
  SENTINEL_PROTOCOLS,
  SENTINEL_GUIDANCE_THRESHOLD,
  SENTINEL_GUIDANCE_DURATION,
  SENTINEL_DEEP_DIVE_THRESHOLD,
  SENTINEL_DEEP_DIVE_DURATION,
  RESONANCE_DECAY_RATE,
} from '../constants';

export const SentinelSystem = () => {
  const guidanceTimer = useRef(0);
  const deepDiveTimer = useRef(0);

  useFrame((state, delta) => {
    const { currentStress, setDecayRate } = useResonanceStore.getState();
    const { activeProtocol, setProtocol } = useSentinelStore.getState();

    // Check GUIDANCE condition
    if (currentStress > SENTINEL_GUIDANCE_THRESHOLD) {
      guidanceTimer.current += delta;
      deepDiveTimer.current = 0; // Reset other timer

      if (
        guidanceTimer.current > SENTINEL_GUIDANCE_DURATION &&
        activeProtocol !== SENTINEL_PROTOCOLS.GUIDANCE
      ) {
        setProtocol(SENTINEL_PROTOCOLS.GUIDANCE);
        setDecayRate(RESONANCE_DECAY_RATE * 2); // Accelerate decay to help recover
      }
    }
    // Check DEEP_DIVE condition
    else if (currentStress < SENTINEL_DEEP_DIVE_THRESHOLD) {
      deepDiveTimer.current += delta;
      guidanceTimer.current = 0; // Reset other timer

      if (
        deepDiveTimer.current > SENTINEL_DEEP_DIVE_DURATION &&
        activeProtocol !== SENTINEL_PROTOCOLS.DEEP_DIVE
      ) {
        setProtocol(SENTINEL_PROTOCOLS.DEEP_DIVE);
        setDecayRate(RESONANCE_DECAY_RATE * 0.5); // Slower decay to sustain state
      }
    }
    // Fallback / Revert to OBSERVER
    else {
      // Failure to sustain these conditions reverts the protocol to OBSERVER.
      guidanceTimer.current = 0;
      deepDiveTimer.current = 0;

      if (activeProtocol !== SENTINEL_PROTOCOLS.OBSERVER) {
        setProtocol(SENTINEL_PROTOCOLS.OBSERVER);
        setDecayRate(RESONANCE_DECAY_RATE);
      }
    }
  });

  return null;
};
