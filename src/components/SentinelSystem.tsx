import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore, SentinelProtocol } from '../stores/useSentinelStore';
import { SENTINEL_PROTOCOLS } from '../constants';

export const SentinelSystem = () => {
  const setDecayRate = useResonanceStore((state) => state.setDecayRate);
  const setProtocol = useSentinelStore((state) => state.setProtocol);
  const activeProtocol = useSentinelStore((state) => state.activeProtocol);

  const highStressTimer = useRef(0);
  const lowStressTimer = useRef(0);

  useFrame((state, delta) => {
    const stress = useResonanceStore.getState().currentStress;
    let nextProtocol: SentinelProtocol = activeProtocol;

    if (stress > 0.8) {
      // High Stress Logic
      lowStressTimer.current = 0;
      highStressTimer.current += delta;

      if (highStressTimer.current > 3) {
        nextProtocol = 'GUIDANCE';
      } else if (activeProtocol === 'GUIDANCE') {
        nextProtocol = 'GUIDANCE'; // Maintain if already there
      } else {
        nextProtocol = 'OBSERVER'; // Revert/Stay OBSERVER while waiting
      }
    } else if (stress < 0.2) {
      // Low Stress Logic
      highStressTimer.current = 0;
      lowStressTimer.current += delta;

      if (lowStressTimer.current > 5) {
        nextProtocol = 'DEEP_DIVE';
      } else if (activeProtocol === 'DEEP_DIVE') {
        nextProtocol = 'DEEP_DIVE'; // Maintain if already there
      } else {
        nextProtocol = 'OBSERVER'; // Revert/Stay OBSERVER while waiting
      }
    } else {
      // Intermediate Zone
      highStressTimer.current = 0;
      lowStressTimer.current = 0;
      nextProtocol = 'OBSERVER';
    }

    // Apply Change
    if (nextProtocol !== activeProtocol) {
      setProtocol(nextProtocol);
      setDecayRate(SENTINEL_PROTOCOLS[nextProtocol].decayRate);
    }
  });

  return null;
};
