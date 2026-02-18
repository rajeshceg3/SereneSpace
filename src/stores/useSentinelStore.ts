import { create } from 'zustand';
import { SENTINEL_PROTOCOLS, THREAT_LEVELS, COUNTER_MEASURES } from '../constants';

type Protocol = keyof typeof SENTINEL_PROTOCOLS;
type ThreatLevel = keyof typeof THREAT_LEVELS;
type CounterMeasure = keyof typeof COUNTER_MEASURES;

interface SentinelState {
  activeProtocol: Protocol;
  lastSwitchTime: number;

  threatLevel: ThreatLevel;
  activeCounterMeasures: CounterMeasure[];
  isManualOverride: boolean;

  // New Tactical Controls
  lockedProtocol: Protocol | null;
  isSimulationPaused: boolean;

  setProtocol: (protocol: Protocol) => void;
  setThreatLevel: (level: ThreatLevel) => void;
  setManualOverride: (enabled: boolean) => void;
  setLockedProtocol: (protocol: Protocol | null) => void;
  setSimulationPaused: (paused: boolean) => void;
  activateCounterMeasure: (measure: CounterMeasure) => void;
  deactivateCounterMeasure: (measure: CounterMeasure) => void;
  reset: () => void;
}

export const useSentinelStore = create<SentinelState>((set) => ({
  activeProtocol: 'OBSERVER',
  lastSwitchTime: Date.now(),

  threatLevel: 'SAFE',
  activeCounterMeasures: [],
  isManualOverride: false,

  lockedProtocol: null,
  isSimulationPaused: false,

  setProtocol: (protocol) => set((state) => {
    if (state.activeProtocol === protocol) return state;
    return {
      activeProtocol: protocol,
      lastSwitchTime: Date.now(),
    };
  }),

  setThreatLevel: (level) => set((state) => {
    if (state.threatLevel === level) return state;
    return { threatLevel: level };
  }),

  setManualOverride: (enabled) => set({ isManualOverride: enabled }),

  setLockedProtocol: (protocol) => set({ lockedProtocol: protocol }),

  setSimulationPaused: (paused) => set({ isSimulationPaused: paused }),

  activateCounterMeasure: (measure) => set((state) => {
    if (state.activeCounterMeasures.includes(measure)) return state;
    return { activeCounterMeasures: [...state.activeCounterMeasures, measure] };
  }),

  deactivateCounterMeasure: (measure) => set((state) => {
    if (!state.activeCounterMeasures.includes(measure)) return state;
    return { activeCounterMeasures: state.activeCounterMeasures.filter((m) => m !== measure) };
  }),

  reset: () => set({
    activeProtocol: 'OBSERVER',
    lastSwitchTime: Date.now(),
    threatLevel: 'SAFE',
    activeCounterMeasures: [],
    isManualOverride: false,
  }),
}));
