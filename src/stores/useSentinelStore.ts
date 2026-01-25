import { create } from 'zustand';
import { TelemetryPoint } from './useTelemetryStore';
import {
  RESONANCE_DECAY_RATE,
  RESONANCE_FOG_MULTIPLIER
} from '../constants';

export type ProtocolType = 'OBSERVER' | 'GUIDANCE' | 'DEEP_DIVE';

interface ActiveParameters {
  decayRate: number;
  fogSensitivity: number;
}

interface SentinelState {
  protocol: ProtocolType;
  coherence: number; // 0-100 score of user calm
  activeParameters: ActiveParameters;

  // Actions
  evaluate: (sessionData: TelemetryPoint[]) => void;
  setProtocol: (protocol: ProtocolType) => void;
  resetSentinel: () => void;
}

const PROTOCOL_CONFIG: Record<ProtocolType, ActiveParameters> = {
  OBSERVER: {
    decayRate: RESONANCE_DECAY_RATE,
    fogSensitivity: RESONANCE_FOG_MULTIPLIER,
  },
  GUIDANCE: {
    // High stress: Help user recover faster, reduce visual noise
    decayRate: RESONANCE_DECAY_RATE * 2.5,
    fogSensitivity: RESONANCE_FOG_MULTIPLIER * 0.5,
  },
  DEEP_DIVE: {
    // Low stress: Challenge user to maintain focus, enhance visual feedback
    decayRate: RESONANCE_DECAY_RATE * 0.8,
    fogSensitivity: RESONANCE_FOG_MULTIPLIER * 1.5,
  },
};

export const useSentinelStore = create<SentinelState>((set) => ({
  protocol: 'OBSERVER',
  coherence: 50, // Start neutral
  activeParameters: PROTOCOL_CONFIG.OBSERVER,

  evaluate: (sessionData: TelemetryPoint[]) => {
    if (sessionData.length < 5) return; // Need minimum data

    // Calculate average stress (0-1)
    const recentSamples = sessionData.slice(-20); // Look at last 20 samples or fewer
    const sum = recentSamples.reduce((acc, point) => acc + point.value, 0);
    const averageStress = sum / recentSamples.length;

    // Calculate coherence (inverse of stress, scaled 0-100)
    const coherence = Math.round((1 - averageStress) * 100);

    let newProtocol: ProtocolType = 'OBSERVER';

    if (averageStress > 0.6) {
      newProtocol = 'GUIDANCE';
    } else if (averageStress < 0.2) {
      newProtocol = 'DEEP_DIVE';
    }

    set({
      protocol: newProtocol,
      coherence,
      activeParameters: PROTOCOL_CONFIG[newProtocol],
    });
  },

  setProtocol: (protocol: ProtocolType) =>
    set({
      protocol,
      activeParameters: PROTOCOL_CONFIG[protocol],
    }),

  resetSentinel: () =>
    set({
      protocol: 'OBSERVER',
      coherence: 50,
      activeParameters: PROTOCOL_CONFIG.OBSERVER,
    }),
}));
