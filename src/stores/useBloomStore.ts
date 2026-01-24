import { create } from 'zustand';

interface BloomState {
  bloomedDestinations: Record<string, boolean>;
  setBloomed: (id: string) => void;
  resetBloom: () => void;
}

export const useBloomStore = create<BloomState>((set) => ({
  bloomedDestinations: {},
  setBloomed: (id: string) =>
    set((state) => ({
      bloomedDestinations: { ...state.bloomedDestinations, [id]: true },
    })),
  resetBloom: () => set({ bloomedDestinations: {} }),
}));
