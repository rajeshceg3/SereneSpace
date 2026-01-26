import { create } from 'zustand';
import { SENTINEL_PROTOCOLS } from '../constants';

export type SentinelProtocol = keyof typeof SENTINEL_PROTOCOLS;

interface SentinelState {
  activeProtocol: SentinelProtocol;
  setProtocol: (protocol: SentinelProtocol) => void;
}

export const useSentinelStore = create<SentinelState>((set) => ({
  activeProtocol: SENTINEL_PROTOCOLS.OBSERVER,
  setProtocol: (protocol: SentinelProtocol) => set({ activeProtocol: protocol }),
}));
