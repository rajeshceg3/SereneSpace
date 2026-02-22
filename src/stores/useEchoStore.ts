import { create } from 'zustand';

export type EchoMode = 'MONITOR' | 'ADAPT' | 'LOCKED' | 'MANUAL';

export interface EchoSnapshot {
  timestamp: number;
  stress: number;
  coherence: number;
  audioState: {
    droneFreq: number;
    binauralFreq: number;
    pinkNoise: number;
    brownNoise: number;
  };
  resonanceScore: number; // 0-100, calculated correlation
}

// Legacy Visual Echo Support
export interface VisualEcho {
  id: string;
  position: [number, number, number];
  timestamp: number;
  type: 'calm' | 'resonance';
}

interface EchoState {
  mode: EchoMode;
  isEnabled: boolean;

  // Visual Echoes (Legacy)
  echoes: VisualEcho[];

  // Real-time Metrics
  currentStress: number;
  currentCoherence: number;
  resonanceScore: number;

  // Audio Parameter Tracking (Mirror of AudioEngine state for UI)
  activeDroneFreq: number;
  activeBinauralFreq: number;
  activePinkNoise: number;
  activeBrownNoise: number;

  // History
  snapshots: EchoSnapshot[];

  // Actions
  setMode: (mode: EchoMode) => void;
  setEnabled: (enabled: boolean) => void;
  updateMetrics: (stress: number, coherence: number, resonance: number) => void;
  updateAudioState: (drone: number, binaural: number, pink: number, brown: number) => void;
  addSnapshot: (snapshot: EchoSnapshot) => void;
  clearHistory: () => void;

  // Visual Echo Actions
  addEcho: (position: [number, number, number]) => void;
  clearEchoes: () => void;
  loadEchoes: () => void;
}

export const useEchoStore = create<EchoState>((set) => ({
  mode: 'MONITOR',
  isEnabled: true,

  echoes: [],

  currentStress: 0,
  currentCoherence: 0,
  resonanceScore: 0,

  activeDroneFreq: 110,
  activeBinauralFreq: 10,
  activePinkNoise: 0.5,
  activeBrownNoise: 0.5,

  snapshots: [],

  setMode: (mode) => set({ mode }),
  setEnabled: (enabled) => set({ isEnabled: enabled }),

  updateMetrics: (stress, coherence, resonance) => set({
    currentStress: stress,
    currentCoherence: coherence,
    resonanceScore: resonance
  }),

  updateAudioState: (drone, binaural, pink, brown) => set({
    activeDroneFreq: drone,
    activeBinauralFreq: binaural,
    activePinkNoise: pink,
    activeBrownNoise: brown
  }),

  addSnapshot: (snapshot) => set((state) => ({
    snapshots: [...state.snapshots.slice(-49), snapshot] // Keep last 50
  })),

  clearHistory: () => set({ snapshots: [] }),

  // Visual Echo Implementation
  addEcho: (position) => set((state) => {
    const newEcho: VisualEcho = {
      id: crypto.randomUUID(),
      position,
      timestamp: Date.now(),
      type: 'calm'
    };
    const newEchoes = [...state.echoes, newEcho].slice(-100); // Limit to 100
    try {
        localStorage.setItem('echo_history', JSON.stringify(newEchoes));
    } catch (e) { console.warn('LocalStorage failed', e); }
    return { echoes: newEchoes };
  }),

  clearEchoes: () => {
    set({ echoes: [] });
    try {
        localStorage.removeItem('echo_history');
    } catch (e) { console.warn('LocalStorage failed', e); }
  },

  loadEchoes: () => {
    try {
        const stored = localStorage.getItem('echo_history');
        if (stored) {
            set({ echoes: JSON.parse(stored) });
        }
    } catch (e) { console.warn('LocalStorage failed', e); }
  }
}));
