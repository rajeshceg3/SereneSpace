import { create } from 'zustand';

export type SentinelProtocol = 'OBSERVER' | 'GUIDANCE' | 'DEEP_DIVE';

interface SentinelState {
  activeProtocol: SentinelProtocol;
  setProtocol: (protocol: SentinelProtocol) => void;
}

export const useSentinelStore = create<SentinelState>((set) => ({
  activeProtocol: 'OBSERVER',
  setProtocol: (protocol: SentinelProtocol) => set({ activeProtocol: protocol }),
}));
