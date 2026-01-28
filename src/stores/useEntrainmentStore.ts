import { create } from 'zustand';
import { ENTRAINMENT_FREQUENCIES, ENTRAINMENT_CONFIG } from '../constants';

interface EntrainmentState {
  targetFreq: number;
  currentFreq: number; // For internal smoothing if needed, or just use target
  currentPulse: number; // 0 to 1
  intensity: number;
  isActive: boolean;

  setTargetFreq: (freq: number) => void;
  setIntensity: (intensity: number) => void;
  setActive: (active: boolean) => void;
  updatePulse: (value: number) => void;
  updateCurrentFreq: (freq: number) => void;
  reset: () => void;
}

export const useEntrainmentStore = create<EntrainmentState>((set) => ({
  targetFreq: ENTRAINMENT_FREQUENCIES.ALPHA,
  currentFreq: ENTRAINMENT_FREQUENCIES.ALPHA,
  currentPulse: 0,
  intensity: ENTRAINMENT_CONFIG.BASE_INTENSITY,
  isActive: true,

  setTargetFreq: (freq) => set({ targetFreq: freq }),
  setIntensity: (intensity) => set({ intensity }),
  setActive: (isActive) => set({ isActive }),
  updatePulse: (currentPulse) => set({ currentPulse }),
  updateCurrentFreq: (currentFreq) => set({ currentFreq }),

  reset: () => set({
    targetFreq: ENTRAINMENT_FREQUENCIES.ALPHA,
    currentFreq: ENTRAINMENT_FREQUENCIES.ALPHA,
    currentPulse: 0,
    intensity: ENTRAINMENT_CONFIG.BASE_INTENSITY,
    isActive: true,
  }),
}));
