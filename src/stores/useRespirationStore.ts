import { create } from 'zustand';

export const BreathPhase = {
  INHALE: 'INHALE',
  HOLD_IN: 'HOLD_IN',
  EXHALE: 'EXHALE',
  HOLD_OUT: 'HOLD_OUT',
} as const;

export type BreathPhase = typeof BreathPhase[keyof typeof BreathPhase];

export interface BreathDurations {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

export interface BreathPattern {
  id: string;
  name: string;
  description: string;
  durations: BreathDurations;
}

export const BREATH_PATTERNS: Record<string, BreathPattern> = {
  COHERENCE: {
    id: 'COHERENCE',
    name: 'Coherence',
    description: 'Balances the nervous system (5.5s In, 5.5s Out)',
    durations: { inhale: 5.5, holdIn: 0, exhale: 5.5, holdOut: 0 },
  },
  RELAX_478: {
    id: 'RELAX_478',
    name: 'Deep Relax (4-7-8)',
    description: 'Reduces anxiety and aids sleep',
    durations: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  },
  BOX_BREATHING: {
    id: 'BOX_BREATHING',
    name: 'Box Breathing',
    description: 'Heightens performance and concentration',
    durations: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  },
};

interface RespirationState {
  isActive: boolean;
  inputMode: 'PROCEDURAL' | 'MICROPHONE';
  selectedPatternId: string;
  currentPhase: BreathPhase;
  coherence: number; // 0-100 score of rhythmic consistency
  breathRate: number; // Breaths per minute

  // Actions
  toggleActive: () => void;
  setInputMode: (mode: 'PROCEDURAL' | 'MICROPHONE') => void;
  setPattern: (patternId: string) => void;
  setPhase: (phase: BreathPhase) => void; // Called by the Controller/System
  setCoherence: (val: number) => void;
  setBreathRate: (val: number) => void;
}

export const useRespirationStore = create<RespirationState>((set) => ({
  isActive: false,
  inputMode: 'PROCEDURAL',
  selectedPatternId: 'COHERENCE',
  currentPhase: BreathPhase.INHALE,
  coherence: 80, // Default to high coherence for new users
  breathRate: 6, // Default to 6bpm

  toggleActive: () => set((state) => ({ isActive: !state.isActive })),
  setInputMode: (mode) => set({ inputMode: mode }),
  setCoherence: (val: number) => set({ coherence: val }),
  setBreathRate: (val: number) => set({ breathRate: val }),
  setPattern: (patternId) => {
    if (BREATH_PATTERNS[patternId]) {
      set({ selectedPatternId: patternId });
    }
  },
  setPhase: (phase) => set({ currentPhase: phase }),
}));
