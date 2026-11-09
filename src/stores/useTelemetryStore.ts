import { create } from 'zustand';
import type { TelemetryPoint } from '../types';

export interface SpatialPoint {
  x: number;
  y: number;
  z: number;
  qx?: number; // quaternion x
  qy?: number; // quaternion y
  qz?: number; // quaternion z
  qw?: number; // quaternion w
  stress: number;
  coherence: number;
  timestamp: number;
}

export interface SessionSummary {
  id: string;
  timestamp: number; // Session end time
  duration: number; // in seconds
  averageStress: number; // 0-1
  coherenceScore: number; // 0-100
  sessionPath?: SpatialPoint[]; // Optional, as old sessions won't have it
}

interface TelemetryState {
  sessionData: TelemetryPoint[];
  sessionPath: SpatialPoint[];
  history: SessionSummary[];
  isRecording: boolean;
  isDebriefOpen: boolean;
  archiveError: string;

  // Actions
  logSample: (value: number) => void;
  logSpatialSample: (x: number, y: number, z: number, stress: number, coherence: number, quaternion?: { x: number; y: number; z: number; w: number }) => void;
  logEvent: (eventName: string, value: number) => void;
  toggleRecording: () => void;
  setDebriefOpen: (isOpen: boolean) => void;
  resetSession: () => void;
  archiveSession: () => boolean;
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
  sessionPath: [],
  history: getInitialHistory(),
  isRecording: true,
  isDebriefOpen: false,
  archiveError: '',

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

  logSpatialSample: (x: number, y: number, z: number, stress: number, coherence: number, quaternion?: { x: number; y: number; z: number; w: number }) =>
    set((state) => {
      if (!state.isRecording) return {};
      // Append efficiently
      const point: SpatialPoint = { x, y, z, stress, coherence, timestamp: Date.now() };
      if (quaternion) {
        point.qx = quaternion.x;
        point.qy = quaternion.y;
        point.qz = quaternion.z;
        point.qw = quaternion.w;
      }
      return {
        sessionPath: [
          ...state.sessionPath,
          point
        ]
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
    set({ sessionData: [], sessionPath: [] }),

  archiveSession: () => {
    const { sessionData, sessionPath, history } = get();
    if (sessionData.length === 0) {
      set({ archiveError: 'There is no session to archive yet.' });
      return false;
    }

    const startTime = sessionData[0].timestamp;
    const endTime = sessionData[sessionData.length - 1].timestamp;
    const duration = Math.floor((endTime - startTime) / 1000);

    const averageStress = sessionData.reduce((acc, curr) => acc + curr.value, 0) / sessionData.length;
    const coherenceScore = Math.round((1 - averageStress) * 100);

    // Limit path resolution if needed (e.g., keep 1 point per second if too dense)
    // But for now, we trust the recorder to throttle.

    const summary: SessionSummary = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      duration,
      averageStress,
      coherenceScore,
      sessionPath: [...sessionPath] // Clone to detach
    };

    // Keep only last 10 sessions to prevent localStorage overflow
    const newHistory = [...history, summary].slice(-10);

    // Commit storage first. A quota/blocked-storage failure must not discard
    // the only in-memory session or close its debrief as if it was archived.
    if (typeof window === 'undefined') {
      set({ archiveError: 'This browser cannot save the session. Your current session is still here.' });
      return false;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch {
      set({ archiveError: 'The session was not saved. Your current session is still here. Free browser storage or try again before closing this tab.' });
      return false;
    }
    set({ history: newHistory, sessionData: [], sessionPath: [], archiveError: '' });
    return true;
  }
}));
