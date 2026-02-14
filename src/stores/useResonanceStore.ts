import { create } from 'zustand';
import { RESONANCE_DECAY_RATE } from '../constants';

interface ResonanceState {
  currentStress: number;
  decayRate: number;
  addStress: (amount: number) => void;
  decayStress: (amount?: number) => void;
  setDecayRate: (rate: number) => void;
  setStress: (value: number) => void;
}

// Force-include
export const useResonanceStore = create<ResonanceState>((set) => ({
  currentStress: 0,
  decayRate: RESONANCE_DECAY_RATE,
  addStress: (amount: number) =>
    set((state) => ({
      currentStress: Math.min(state.currentStress + amount, 1),
    })),
  decayStress: (amount) =>
    set((state) => ({
      currentStress: Math.max(state.currentStress - (amount !== undefined ? amount : state.decayRate), 0),
    })),
  setDecayRate: (rate: number) => set({ decayRate: rate }),
  setStress: (value: number) => set({ currentStress: Math.max(0, Math.min(1, value)) }),
}));
