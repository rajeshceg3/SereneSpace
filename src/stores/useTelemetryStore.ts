import { create } from 'zustand';

export interface TelemetryPoint {
  timestamp: number;
  value: number; // 0 to 1 (stress level)
  event?: string; // Optional label for specific events (e.g., "Destination Arrived")
}

interface TelemetryState {
  sessionData: TelemetryPoint[];
  isRecording: boolean;
  isDebriefOpen: boolean;

  // Actions
  logSample: (value: number) => void;
  logEvent: (eventName: string, value: number) => void;
  toggleRecording: () => void;
  setDebriefOpen: (isOpen: boolean) => void;
  resetSession: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  sessionData: [],
  isRecording: true,
  isDebriefOpen: false,

  logSample: (value: number) =>
    set((state) => {
      if (!state.isRecording) return {};
      return {
        sessionData: [
          ...state.sessionData,
          { timestamp: Date.now(), value },
        ],
      };
    }),

  logEvent: (eventName: string, value: number) =>
    set((state) => {
        if (!state.isRecording) return {};
        return {
            sessionData: [
            ...state.sessionData,
            { timestamp: Date.now(), value, event: eventName },
            ],
        };
    }),

  toggleRecording: () =>
    set((state) => ({ isRecording: !state.isRecording })),

  setDebriefOpen: (isOpen: boolean) =>
    set({ isDebriefOpen: isOpen }),

  resetSession: () =>
    set({ sessionData: [] }),
}));
