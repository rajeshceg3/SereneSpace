import { create } from 'zustand';
import { RESONANCE_DECAY_RATE } from '../constants';

interface ResonanceState {
  currentStress: number;
  addStress: (amount: number) => void;
  decayStress: () => void;
}

export const useResonanceStore = create<ResonanceState>((set) => ({
  currentStress: 0,
  addStress: (amount: number) =>
    set((state) => ({
      currentStress: Math.min(state.currentStress + amount, 1),
    })),
  decayStress: () =>
    set((state) => ({
      currentStress: Math.max(state.currentStress - RESONANCE_DECAY_RATE, 0),
    })),
}));
