import { create } from 'zustand';
import type { TelemetryPoint } from '../types';
import type { SpatialPoint } from './useTelemetryStore';

export interface OculusState {
  isReplaying: boolean;
  currentTime: number; // in milliseconds, relative to start of session
  duration: number; // in milliseconds
  playbackSpeed: number;
  sessionData: TelemetryPoint[]; // For stress graph
  sessionPath: SpatialPoint[]; // For 3D path

  // Actions
  startReplay: (sessionPath: SpatialPoint[], sessionData: TelemetryPoint[]) => void;
  stopReplay: () => void;
  seek: (time: number) => void; // time in ms relative to start
  setSpeed: (speed: number) => void;
  tick: (delta: number) => void; // delta in seconds
}

export const useOculusStore = create<OculusState>((set, get) => ({
  isReplaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
  sessionData: [],
  sessionPath: [],

  startReplay: (sessionPath, sessionData) => {
    if (!sessionPath || sessionPath.length === 0) {
      console.warn('Cannot replay empty session');
      return;
    }
    const startTime = sessionPath[0].timestamp;
    const endTime = sessionPath[sessionPath.length - 1].timestamp;

    set({
      isReplaying: true,
      currentTime: 0,
      duration: endTime - startTime,
      sessionPath,
      sessionData,
      playbackSpeed: 1,
    });
  },

  stopReplay: () => {
    set({ isReplaying: false, currentTime: 0 });
  },

  seek: (time) => {
    const { duration } = get();
    set({ currentTime: Math.max(0, Math.min(time, duration)) });
  },

  setSpeed: (speed) => {
    set({ playbackSpeed: speed });
  },

  tick: (delta) => {
    const { isReplaying, currentTime, duration, playbackSpeed } = get();
    if (!isReplaying) return;

    const nextTime = currentTime + (delta * 1000 * playbackSpeed);

    if (nextTime >= duration) {
      set({ currentTime: duration, isReplaying: false });
    } else {
      set({ currentTime: nextTime });
    }
  },
}));
