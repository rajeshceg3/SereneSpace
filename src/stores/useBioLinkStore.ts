import { create } from 'zustand';

interface BioLinkState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  heartRate: number; // BPM
  hrv: number; // ms (RMSSD)
  signalQuality: number; // 0-100 (derived from contact status)

  // Actions
  setConnectionStatus: (isConnected: boolean, isConnecting?: boolean) => void;
  setDeviceName: (name: string | null) => void;
  setHeartRate: (bpm: number) => void;
  setHrv: (ms: number) => void;
  setSignalQuality: (quality: number) => void;
  reset: () => void;
}

export const useBioLinkStore = create<BioLinkState>((set) => ({
  isConnected: false,
  isConnecting: false,
  deviceName: null,
  heartRate: 0,
  hrv: 0,
  signalQuality: 0,

  setConnectionStatus: (isConnected, isConnecting = false) =>
    set({ isConnected, isConnecting }),

  setDeviceName: (name) => set({ deviceName: name }),

  setHeartRate: (bpm) => set({ heartRate: bpm }),

  setHrv: (ms) => set({ hrv: ms }),

  setSignalQuality: (quality) => set({ signalQuality: quality }),

  reset: () => set({
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    heartRate: 0,
    hrv: 0,
    signalQuality: 0
  })
}));
