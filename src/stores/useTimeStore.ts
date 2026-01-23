import { create } from 'zustand';
import { TIME_PHASES } from '../constants';

export type TimePhase = keyof typeof TIME_PHASES;

interface TimeState {
  phase: TimePhase;
  updatePhase: () => void;
}

export const getCurrentPhase = (date: Date = new Date()): TimePhase => {
  const hour = date.getHours();

  if (hour >= TIME_PHASES.DAWN.start && hour < TIME_PHASES.DAWN.end) return 'DAWN';
  if (hour >= TIME_PHASES.DAY.start && hour < TIME_PHASES.DAY.end) return 'DAY';
  if (hour >= TIME_PHASES.DUSK.start && hour < TIME_PHASES.DUSK.end) return 'DUSK';
  return 'NIGHT';
};

export const useTimeStore = create<TimeState>((set) => ({
  phase: getCurrentPhase(),
  updatePhase: () => {
    set({ phase: getCurrentPhase() });
  },
}));
