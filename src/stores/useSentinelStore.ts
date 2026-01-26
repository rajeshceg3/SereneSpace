import { create } from 'zustand';
import { SENTINEL_PROTOCOLS } from '../constants';

type Protocol = keyof typeof SENTINEL_PROTOCOLS;

interface SentinelState {
  activeProtocol: Protocol;
  lastSwitchTime: number;

  setProtocol: (protocol: Protocol) => void;
  reset: () => void;
}

export const useSentinelStore = create<SentinelState>((set) => ({
  activeProtocol: 'OBSERVER',
  lastSwitchTime: Date.now(),

  setProtocol: (protocol) => set((state) => {
    if (state.activeProtocol === protocol) return state;
    return {
      activeProtocol: protocol,
      lastSwitchTime: Date.now(),
    };
  }),

  reset: () => set({
    activeProtocol: 'OBSERVER',
    lastSwitchTime: Date.now(),
  }),
}));
