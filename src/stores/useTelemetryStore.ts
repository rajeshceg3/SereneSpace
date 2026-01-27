import { create } from 'zustand';
import type { TelemetryPoint } from '../types';

export interface SessionSummary {
  id: string;
  timestamp: number; // Session end time
  duration: number; // in seconds
  averageStress: number; // 0-1
  coherenceScore: number; // 0-100
}

interface TelemetryState {
  sessionData: TelemetryPoint[];
  history: SessionSummary[];
  isRecording: boolean;
  isDebriefOpen: boolean;

  // Actions
  logSample: (value: number) => void;
  logEvent: (eventName: string, value: number) => void;
  toggleRecording: () => void;
  setDebriefOpen: (isOpen: boolean) => void;
  resetSession: () => void;
  archiveSession: () => void;
}

const STORAGE_KEY = 'telemetry_history';

const getInitialHistory = (): SessionSummary[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.warn('Failed to load telemetry history', e);
    return [];
  }
};

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  sessionData: [],
  history: getInitialHistory(),
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

  archiveSession: () => {
    const { sessionData, history } = get();
    if (sessionData.length === 0) return;

    const startTime = sessionData[0].timestamp;
    const endTime = sessionData[sessionData.length - 1].timestamp;
    const duration = Math.floor((endTime - startTime) / 1000);

    const averageStress = sessionData.reduce((acc, curr) => acc + curr.value, 0) / sessionData.length;
    const coherenceScore = Math.round((1 - averageStress) * 100);

    const summary: SessionSummary = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      duration,
      averageStress,
      coherenceScore
    };

    const newHistory = [...history, summary];

    set({
      history: newHistory,
      sessionData: [] // Auto-reset after archiving
    });

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.warn('Failed to save telemetry history', e);
      }
    }
  }
}));
