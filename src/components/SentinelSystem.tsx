import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import {
  SENTINEL_HYSTERESIS_MS,
  SENTINEL_DEEP_DIVE_DELAY_MS,
  SENTINEL_PROTOCOLS
} from '../constants';
import { analytics } from '../services/AnalyticsService';

export const SentinelSystem = () => {
  const setProtocol = useSentinelStore((state) => state.setProtocol);
  const highStressTimer = useRef(0);
  const lowStressTimer = useRef(0);

  useFrame((_, delta) => {
    const stress = useResonanceStore.getState().currentStress;
    const activeProtocol = useSentinelStore.getState().activeProtocol;
    const setDecayRate = useResonanceStore.getState().setDecayRate;

    // Timer Logic
    if (stress > 0.8) {
      highStressTimer.current += delta * 1000;
    } else {
      highStressTimer.current = 0;
    }

    if (stress < 0.2) {
      lowStressTimer.current += delta * 1000;
    } else {
      lowStressTimer.current = 0;
    }

    // Switching Logic
    if (activeProtocol === 'OBSERVER') {
        if (highStressTimer.current > SENTINEL_HYSTERESIS_MS) {
            setProtocol('GUIDANCE');
            analytics.track('Sentinel Protocol Changed', { protocol: 'GUIDANCE', cause: 'High Stress Hysteresis' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.GUIDANCE.decayRate);
        } else if (lowStressTimer.current > SENTINEL_DEEP_DIVE_DELAY_MS) {
            setProtocol('DEEP_DIVE');
            analytics.track('Sentinel Protocol Changed', { protocol: 'DEEP_DIVE', cause: 'Low Stress Hysteresis' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.DEEP_DIVE.decayRate);
        }
    } else if (activeProtocol === 'GUIDANCE') {
        // Exit Guidance if stress drops sufficiently
        if (stress < 0.6) {
            setProtocol('OBSERVER');
            analytics.track('Sentinel Protocol Changed', { protocol: 'OBSERVER', cause: 'Stress Normalized' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.OBSERVER.decayRate);
        }
    } else if (activeProtocol === 'DEEP_DIVE') {
        // Exit Deep Dive if stress rises slightly
        if (stress > 0.3) {
            setProtocol('OBSERVER');
            analytics.track('Sentinel Protocol Changed', { protocol: 'OBSERVER', cause: 'Stress Increased' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.OBSERVER.decayRate);
        }
    }
  });

  return null;
};
