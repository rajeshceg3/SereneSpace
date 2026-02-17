import { useState, useEffect } from 'react';
import { useSentinelStore } from '../../stores/useSentinelStore';
import { usePredictionStore } from '../../stores/usePredictionStore';
import { useResonanceStore } from '../../stores/useResonanceStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useAudioStore } from '../../stores/useAudioStore';
import type { AegisMetrics } from './types';

export const useAegisData = (): AegisMetrics => {
  const sentinel = useSentinelStore();
  const prediction = usePredictionStore();
  const resonance = useResonanceStore();
  const telemetry = useTelemetryStore();
  const audio = useAudioStore();

  const [metrics, setMetrics] = useState<AegisMetrics>({
    protocol: 'OBSERVER',
    protocolDuration: 0,
    stressVelocity: 0,
    projectedStress: 0,
    confidence: 0,
    currentStress: 0,
    coherence: 100,
    history: [],
    isRecording: false,
    isManualOverride: false,
    manualAudioMode: false,
    threatLevel: 'SAFE',
  });

  useEffect(() => {
    // Update loop running at 10Hz to avoid react thrashing but keep HUD snappy
    const interval = setInterval(() => {
      const now = Date.now();
      const protocolDuration = Math.floor((now - sentinel.lastSwitchTime) / 1000);

      // Calculate coherence roughly from recent session data if real score isn't ready
      // Telemetry store has sessionData: { timestamp, value }[]
      // We'll take the last 20 points
      const recentData = telemetry.sessionData.slice(-20);
      const historyValues = recentData.map(d => d.value);

      // Simple variance-based coherence for real-time display
      // Lower variance = higher coherence
      let coherence = 100;
      if (historyValues.length > 1) {
        const mean = historyValues.reduce((a, b) => a + b, 0) / historyValues.length;
        const variance = historyValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historyValues.length;
        // Normalize: Variance of 0.2 is chaos (0 coherence), 0 is perfect (100)
        coherence = Math.max(0, Math.min(100, 100 * (1 - (variance * 5))));
      }

      setMetrics({
        protocol: sentinel.activeProtocol,
        protocolDuration,
        stressVelocity: prediction.stressVelocity,
        projectedStress: prediction.projectedStress,
        confidence: prediction.confidence,
        currentStress: resonance.currentStress,
        coherence: Math.round(coherence),
        history: historyValues,
        isRecording: telemetry.isRecording,
        isManualOverride: sentinel.isManualOverride,
        manualAudioMode: audio.manualMode,
        threatLevel: sentinel.threatLevel,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [sentinel, prediction, resonance, telemetry, audio]);

  return metrics;
};
