import { create } from 'zustand';

export interface Echo {
  id: string;
  position: [number, number, number];
  timestamp: number;
  type: 'calm';
}

interface EchoState {
  echoes: Echo[];
  addEcho: (position: [number, number, number]) => void;
  loadEchoes: () => void;
  clearEchoes: () => void;
}

const STORAGE_KEY = 'echo_history';
const MAX_ECHOES = 100;

export const useEchoStore = create<EchoState>((set, get) => ({
  echoes: [],

  loadEchoes: () => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        set({ echoes: JSON.parse(item) });
      }
    } catch (e) {
      console.warn('Failed to load echoes', e);
    }
  },

  addEcho: (position) => {
    const { echoes } = get();
    const newEcho: Echo = {
      id: Math.random().toString(36).substring(7),
      position,
      timestamp: Date.now(),
      type: 'calm',
    };

    // Append new echo. If we exceed max, remove oldest (shift from start)
    // Actually, slice(-MAX) keeps the *last* MAX items.
    // If we want to keep the newest, we append then slice.
    const updatedEchoes = [...echoes, newEcho];
    if (updatedEchoes.length > MAX_ECHOES) {
        updatedEchoes.shift(); // Remove oldest
    }

    set({ echoes: updatedEchoes });

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEchoes));
      } catch (e) {
        console.warn('Failed to save echoes', e);
      }
    }
  },

  clearEchoes: () => {
      set({ echoes: [] });
      if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE_KEY);
      }
  }
}));
