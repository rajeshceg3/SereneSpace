import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AtlasState, AtlasNode } from '../types';

export const useAtlasStore = create<AtlasState>()(
  persist(
    (set) => ({
      nodes: [],
      isOpen: false,
      addNode: (node: AtlasNode) => set((state) => {
        // Prevent duplicates by ID
        if (state.nodes.some((n) => n.id === node.id)) {
          return state;
        }
        return { nodes: [...state.nodes, node] };
      }),
      toggleAtlas: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (isOpen: boolean) => set({ isOpen }),
      jumpToNode: (_nodeId: string) => {
        // Logic will be handled by subscribers
        set({ isOpen: false });
      },
    }),
    {
      name: 'atlas-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ nodes: state.nodes }), // Only persist nodes
    }
  )
);
