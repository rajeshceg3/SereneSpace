import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { useResonanceStore } from '../stores/useResonanceStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import { useEntrainmentStore } from '../stores/useEntrainmentStore';
import { usePredictionStore } from '../stores/usePredictionStore';
import { PredictiveModel } from '../services/PredictiveModel';
import {
  SENTINEL_HYSTERESIS_MS,
  SENTINEL_DEEP_DIVE_DELAY_MS,
  SENTINEL_PROTOCOLS,
  SENTINEL_ENTRAINMENT_MAP
} from '../constants';
import { analytics } from '../services/AnalyticsService';

export const SentinelSystem = () => {
  const setProtocol = useSentinelStore((state) => state.setProtocol);
  const predictiveModel = useMemo(() => new PredictiveModel(), []);
  const highStressTimer = useRef(0);
  const lowStressTimer = useRef(0);
  const lastUIUpdate = useRef(0);

  useFrame((_, delta) => {
    const stress = useResonanceStore.getState().currentStress;
    const activeProtocol = useSentinelStore.getState().activeProtocol;
    const setDecayRate = useResonanceStore.getState().setDecayRate;
    const setEntrainmentFreq = useEntrainmentStore.getState().setTargetFreq;
    const now = Date.now();

    // Predictive Analysis
    predictiveModel.addSample(stress, now);
    const { velocity, projected, confidence } = predictiveModel.analyze(5);

    // Throttle UI updates to 10Hz to reduce React render cycles
    if (now - lastUIUpdate.current > 100) {
      usePredictionStore.getState().setPrediction(velocity, projected, confidence);
      lastUIUpdate.current = now;
    }

    // Timer Logic
    // Preemptive Trigger: If projected stress > 0.8 with high confidence (>0.7),
    // we start the high stress timer immediately, effectively reducing latency.
    const isProjectedHigh = projected > 0.8 && confidence > 0.7;

    if (stress > 0.8 || isProjectedHigh) {
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
            const cause = isProjectedHigh && stress <= 0.8 ? 'Preemptive High Stress' : 'High Stress Hysteresis';
            analytics.track('Sentinel Protocol Changed', { protocol: 'GUIDANCE', cause });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.GUIDANCE.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.GUIDANCE);
        } else if (lowStressTimer.current > SENTINEL_DEEP_DIVE_DELAY_MS) {
            setProtocol('DEEP_DIVE');
            analytics.track('Sentinel Protocol Changed', { protocol: 'DEEP_DIVE', cause: 'Low Stress Hysteresis' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.DEEP_DIVE.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.DEEP_DIVE);
        }
    } else if (activeProtocol === 'GUIDANCE') {
        // Exit Guidance if stress drops sufficiently
        if (stress < 0.6) {
            setProtocol('OBSERVER');
            analytics.track('Sentinel Protocol Changed', { protocol: 'OBSERVER', cause: 'Stress Normalized' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.OBSERVER.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.OBSERVER);
        }
    } else if (activeProtocol === 'DEEP_DIVE') {
        // Exit Deep Dive if stress rises slightly
        if (stress > 0.3) {
            setProtocol('OBSERVER');
            analytics.track('Sentinel Protocol Changed', { protocol: 'OBSERVER', cause: 'Stress Increased' });
            if (setDecayRate) setDecayRate(SENTINEL_PROTOCOLS.OBSERVER.decayRate);
            setEntrainmentFreq(SENTINEL_ENTRAINMENT_MAP.OBSERVER);
        }
    }
  });

  return null;
};
