import { create } from 'zustand';

interface DestinationState {
  activeDestination: string | null;
  setActiveDestination: (id: string | null) => void;
}

export const useDestinationStore = create<DestinationState>((set) => ({
  activeDestination: null,
  setActiveDestination: (id) => set({ activeDestination: id }),
}));
