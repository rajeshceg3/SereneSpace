import { useEffect } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { useSentinelStore } from '../stores/useSentinelStore';
import { useResonanceStore } from '../stores/useResonanceStore';

/**
 * SentinelSystem (Headless Component)
 *
 * Acting as the "Mission Control" intelligence layer.
 * Monitors telemetry data and automatically adjusts system parameters
 * via the Adaptive Sentinel protocols.
 */
export const SentinelSystem = () => {
  const sessionData = useTelemetryStore((state) => state.sessionData);
  const evaluate = useSentinelStore((state) => state.evaluate);
  const activeDecayRate = useSentinelStore((state) => state.activeParameters.decayRate);

  const setDecayRate = useResonanceStore((state) => state.setDecayRate);

  // 1. Intelligence Loop: Analyze telemetry when new data arrives
  useEffect(() => {
    // Only evaluate periodically to avoid thrashing (e.g., every 5 samples)
    if (sessionData.length > 0 && sessionData.length % 5 === 0) {
      evaluate(sessionData);
    }
  }, [sessionData, evaluate]);

  // 2. Actuator Loop: Sync Sentinel parameters to Resonance system
  useEffect(() => {
    setDecayRate(activeDecayRate);
  }, [activeDecayRate, setDecayRate]);

  return null;
};
