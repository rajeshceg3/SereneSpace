import { create } from 'zustand';

export type NarrativeArc = 'INITIATION' | 'ASCENSION' | 'DESCENT' | 'STASIS';

interface NarrativeState {
  currentArc: NarrativeArc;
  intensity: number; // 0.0 - 1.0
  setArc: (arc: NarrativeArc) => void;
  setIntensity: (intensity: number) => void;
  reset: () => void;
}

export const useNarrativeStore = create<NarrativeState>((set) => ({
  currentArc: 'INITIATION',
  intensity: 0,
  setArc: (arc) => set({ currentArc: arc }),
  setIntensity: (intensity) => set({ intensity }),
  reset: () => set({ currentArc: 'INITIATION', intensity: 0 }),
}));
